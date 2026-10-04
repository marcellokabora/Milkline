import { fetchHerd, HerdApiError, type HerdSnapshot } from '../api/herdApi';
import { createMockStream } from '../api/stream';
import type { Animal, AnimalStatus, MockScenario, StreamEvent } from '../api/types';
import { applyStreamEvent } from '../domain/events';
import { computeFreshness } from '../domain/freshness';
import { compareByPriority } from '../domain/priority';
import { searchAnimals } from '../domain/search';
import { clearCachedHerd, loadCachedHerd, saveCachedHerd } from './cache';

const HERD_ID = 'h_4417';
const SLOW_NOTICE_MS = 2000;
const CACHE_WRITE_EVERY_MS = 10_000;
const RETRY_STEPS_MS = [5_000, 10_000, 20_000, 30_000];

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';
export type StreamState = 'connecting' | 'open' | 'closed';
export type BannerKind = 'offline' | 'unreachable' | 'updating' | 'stale' | null;

interface Displayed {
	order: string[];
	status: Record<string, AnimalStatus>;
}

function buildDisplayed(animals: Record<string, Animal>): Displayed {
	const sorted = Object.values(animals).sort(compareByPriority);
	return {
		order: sorted.map((a) => a.id),
		status: Object.fromEntries(sorted.map((a) => [a.id, a.status]))
	};
}

/**
 * Everything the herd screen knows, in one place.
 *
 * `animals` is always live. `displayed` is a frozen snapshot of who is in which group and in what
 * order: it only changes when the farmer taps "update" (or on first load), so the list never
 * reshuffles under a gloved thumb. Cards still read live data, so flags and status change in place.
 */
class HerdStore {
	readonly herdId = HERD_ID;

	animals = $state<Record<string, Animal>>({});
	displayed = $state.raw<Displayed>({ order: [], status: {} });

	loadState = $state<LoadState>('idle');
	loadSlow = $state(false);
	refreshing = $state(false);
	lastError = $state<string | null>(null);
	fromCache = $state(false);

	streamState = $state<StreamState>('closed');
	browserOnline = $state(true);
	lastDataAt = $state<number | null>(null);
	now = $state(Date.now());

	query = $state('');
	selectedId = $state<string | null>(null);
	sim = $state({ slow: false, fail: false, offline: false, stall: false });

	list = $derived(Object.values(this.animals));
	online = $derived(this.browserOnline && !this.sim.offline);
	connected = $derived(
		this.online && (this.streamState !== 'closed' || this.refreshing || this.loadState === 'loading')
	);
	// Before the first data arrives there is nothing to be fresh or stale about.
	freshness = $derived(
		this.lastDataAt === null && this.online
			? ('unknown' as const)
			: computeFreshness({ now: this.now, lastDataAt: this.lastDataAt, connected: this.connected })
	);

	counts = $derived.by(() => {
		const c: Record<AnimalStatus, number> = {
			critical: 0,
			attention: 0,
			watch: 0,
			no_signal: 0,
			healthy: 0
		};
		for (const a of this.list) c[a.status]++;
		return c;
	});

	pendingIds = $derived(
		this.list.filter((a) => this.displayed.status[a.id] !== a.status).map((a) => a.id)
	);
	pendingHasCritical = $derived(
		this.pendingIds.some((id) => this.animals[id].status === 'critical')
	);
	pendingHasAttention = $derived(
		this.pendingIds.some((id) => this.animals[id].status === 'attention')
	);

	needsYou = $derived(this.group(['critical', 'attention']));
	keepWatch = $derived(this.group(['watch']));
	silent = $derived(this.group(['no_signal']));
	healthy = $derived(
		this.group(['healthy']).sort((a, b) => a.tag.localeCompare(b.tag))
	);

	isSearching = $derived(this.query.trim().length > 0);
	results = $derived(this.isSearching ? searchAnimals(this.list, this.query) : []);
	selected = $derived(this.selectedId ? (this.animals[this.selectedId] ?? null) : null);

	bannerKind = $derived.by((): BannerKind => {
		if (this.loadState !== 'ready') return null;
		if (!this.online) return 'offline';
		if (this.refreshing && (this.fromCache || this.freshness !== 'live')) return 'updating';
		if (this.streamState === 'closed') return 'unreachable';
		if (this.freshness === 'stale') return 'stale';
		return null;
	});

	private stream = createMockStream(() => Object.values(this.animals));
	private controller: AbortController | null = null;
	private retryTimer: ReturnType<typeof setTimeout> | undefined;
	private retryAttempt = 0;
	private lastCacheWrite = 0;

	private group(statuses: AnimalStatus[]): Animal[] {
		return this.displayed.order
			.filter((id) => statuses.includes(this.displayed.status[id]))
			.map((id) => this.animals[id]);
	}

	start(initialScenario?: string | null): () => void {
		if (initialScenario === 'slow') this.sim.slow = true;
		if (initialScenario === 'fail') this.sim.fail = true;
		if (initialScenario === 'offline') this.sim.offline = true;

		this.browserOnline = navigator.onLine;
		const tick = setInterval(() => (this.now = Date.now()), 1000);
		const goOnline = () => this.setBrowserOnline(true);
		const goOffline = () => this.setBrowserOnline(false);
		const persist = () => this.writeCache(true);
		window.addEventListener('online', goOnline);
		window.addEventListener('offline', goOffline);
		window.addEventListener('pagehide', persist);

		this.restoreFromCache();
		void this.load();

		return () => {
			clearInterval(tick);
			clearTimeout(this.retryTimer);
			this.controller?.abort();
			this.stream.disconnect();
			window.removeEventListener('online', goOnline);
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('pagehide', persist);
		};
	}

	/** Shows the last saved herd immediately; a fresh fetch replaces it as soon as it can. */
	private restoreFromCache() {
		const cached = loadCachedHerd(this.herdId, Date.now());
		if (!cached) return;
		this.animals = Object.fromEntries(cached.animals.map((a) => [a.id, a]));
		this.lastDataAt = cached.savedAt;
		this.fromCache = true;
		this.loadState = 'ready';
		this.applyPending();
	}

	async load(): Promise<void> {
		this.controller?.abort();
		const controller = new AbortController();
		this.controller = controller;
		clearTimeout(this.retryTimer);

		const hasData = this.list.length > 0;
		if (hasData) this.refreshing = true;
		else this.loadState = 'loading';
		this.loadSlow = false;
		const slowTimer = setTimeout(() => (this.loadSlow = true), SLOW_NOTICE_MS);

		try {
			if (!this.online) throw new HerdApiError('No connection to the server', 'network');
			const scenario: MockScenario | null = this.sim.fail ? 'fail' : this.sim.slow ? 'slow' : null;
			const snapshot = await fetchHerd(this.herdId, { scenario, signal: controller.signal });
			this.ingest(snapshot);
		} catch (err) {
			if (err instanceof HerdApiError && err.kind === 'aborted') return;
			this.lastError = err instanceof Error ? err.message : 'Something went wrong';
			this.stream.disconnect();
			this.streamState = 'closed';
			if (!hasData) this.loadState = 'error';
			else this.scheduleRetry();
		} finally {
			clearTimeout(slowTimer);
			if (this.controller === controller) {
				this.loadSlow = false;
				this.refreshing = false;
			}
		}
	}

	private ingest(snapshot: HerdSnapshot) {
		const firstView = this.displayed.order.length === 0;
		this.animals = Object.fromEntries(snapshot.animals.map((a) => [a.id, a]));
		this.lastDataAt = Date.now();
		this.fromCache = false;
		this.lastError = null;
		this.loadState = 'ready';
		this.retryAttempt = 0;
		if (firstView) this.applyPending();
		this.writeCache(true);
		this.connectStream();
	}

	private scheduleRetry() {
		const delay = RETRY_STEPS_MS[Math.min(this.retryAttempt, RETRY_STEPS_MS.length - 1)];
		this.retryAttempt++;
		this.retryTimer = setTimeout(() => void this.load(), delay);
	}

	private connectStream() {
		if (this.sim.stall) {
			this.streamState = 'open';
			return;
		}
		this.streamState = 'connecting';
		this.stream.connect({
			onOpen: () => (this.streamState = 'open'),
			onEvent: (event) => this.handleEvent(event)
		});
	}

	private handleEvent(event: StreamEvent) {
		const animal = this.animals[event.animalId];
		if (!animal) return;
		applyStreamEvent(animal, event);
		this.lastDataAt = Date.now();
		this.writeCache(false);
	}

	private writeCache(force: boolean) {
		if (this.lastDataAt === null || this.list.length === 0) return;
		if (!force && Date.now() - this.lastCacheWrite < CACHE_WRITE_EVERY_MS) return;
		this.lastCacheWrite = Date.now();
		saveCachedHerd(this.herdId, this.lastDataAt, $state.snapshot(this.list) as Animal[]);
	}

	private setBrowserOnline(value: boolean) {
		this.browserOnline = value;
		this.syncConnectivity();
	}

	private syncConnectivity() {
		if (!this.online) {
			this.controller?.abort();
			this.refreshing = false;
			clearTimeout(this.retryTimer);
			this.stream.disconnect();
			this.streamState = 'closed';
		} else if (this.loadState !== 'idle') {
			this.retryAttempt = 0;
			void this.load();
		}
	}

	/** Moves the list to match live data. Called by the "N updates" pill. */
	applyPending() {
		this.displayed = buildDisplayed(this.animals);
	}

	retry() {
		this.retryAttempt = 0;
		void this.load();
	}

	open(id: string) {
		this.selectedId = id;
	}

	close() {
		this.selectedId = null;
	}

	// Demo controls: reproduce the failure modes the screen has to survive.

	setSimulation(key: keyof HerdStore['sim'], value: boolean) {
		this.sim[key] = value;
		if (key === 'offline') this.syncConnectivity();
		if (key === 'stall') {
			if (value) {
				// Stream goes quiet while still "connected"; the data is also aged so staleness shows at once.
				this.stream.disconnect();
				if (this.streamState !== 'closed') this.lastDataAt = Date.now() - 3 * 60_000;
			} else if (this.online && this.loadState === 'ready') {
				// Reconcile with the server rather than trusting a stream that was silent.
				void this.load();
			}
		}
	}

	triggerAlert(critical: boolean) {
		if (this.connected && !this.sim.stall) this.stream.triggerFlag({ critical });
	}

	clearSavedData() {
		clearCachedHerd(this.herdId);
	}
}

export const herd = new HerdStore();

import type { Animal, FlagCode, Severity, StreamEvent } from './types';
import { statusFromFlags } from '../domain/priority';

export interface StreamHandlers {
	onOpen: () => void;
	onEvent: (event: StreamEvent) => void;
}

/** Same surface a WebSocket-backed client would expose; swap the factory to go live. */
export interface StreamClient {
	connect(handlers: StreamHandlers): void;
	disconnect(): void;
}

export interface MockStreamControls {
	triggerFlag(options?: { critical?: boolean }): void;
	triggerSensorOffline(): void;
}

const RAISABLE: FlagCode[] = ['TEMP_HIGH', 'RUMINATION_DROP', 'ACTIVITY_LOW', 'YIELD_DROP'];
const OPEN_DELAY_MS = 700;

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);
const round = (n: number, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;

function pickSeverity(): Severity {
	const r = Math.random();
	return r < 0.25 ? 'high' : r < 0.75 ? 'medium' : 'low';
}

function vitalsFor(code: FlagCode, animal: Animal): Partial<Animal['vitals']> {
	const v = animal.vitals;
	switch (code) {
		case 'TEMP_HIGH':
			return { bodyTempC: round(between(39.3, 40.2), 1) };
		case 'RUMINATION_DROP':
			return { ruminationMinutes24h: round(v.ruminationBaseline * between(0.55, 0.8)) };
		case 'ACTIVITY_LOW':
			return { activityIndex: round(v.activityBaseline * between(0.4, 0.62)) };
		case 'YIELD_DROP':
			return { yieldLitres24h: round(v.yieldBaseline * between(0.65, 0.82), 1) };
		default:
			return {};
	}
}

function normalVitalsFor(code: FlagCode, animal: Animal): Partial<Animal['vitals']> {
	const v = animal.vitals;
	switch (code) {
		case 'TEMP_HIGH':
			return { bodyTempC: round(between(38.4, 38.8), 1) };
		case 'RUMINATION_DROP':
			return { ruminationMinutes24h: round(v.ruminationBaseline * between(0.95, 1.03)) };
		case 'ACTIVITY_LOW':
			return { activityIndex: round(v.activityBaseline * between(0.95, 1.05)) };
		case 'YIELD_DROP':
			return { yieldLitres24h: round(v.yieldBaseline * between(0.95, 1.02), 1) };
		default:
			return {};
	}
}

/** Pushes a message every 2-5 s and a flag change roughly every 20-40 s (the real stream is slower). */
export function createMockStream(getAnimals: () => Animal[]): StreamClient & MockStreamControls {
	let handlers: StreamHandlers | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let opening: ReturnType<typeof setTimeout> | undefined;
	let nextFlagAt = 0;

	const emit = (event: StreamEvent) => handlers?.onEvent(event);
	const nowIso = () => new Date().toISOString();

	function emitVitalsTick() {
		const animal = pick(getAnimals().filter((a) => a.status !== 'no_signal'));
		if (!animal) return;
		emit({
			type: 'vitals_update',
			animalId: animal.id,
			at: nowIso(),
			vitals: {
				activityIndex: Math.max(0, round(animal.vitals.activityIndex + between(-3, 3))),
				bodyTempC: round(
					Math.min(Math.max(animal.vitals.bodyTempC + between(-0.1, 0.1), 37.9), 41),
					1
				)
			}
		});
	}

	function triggerFlag({ critical = false }: { critical?: boolean } = {}) {
		const animals = getAnimals();
		const clearable = animals.filter(
			(a) => a.status !== 'no_signal' && a.flags.some((f) => RAISABLE.includes(f.code))
		);
		if (!critical && clearable.length > 3 && Math.random() < 0.35) {
			const animal = pick(clearable);
			const flag = pick(animal.flags.filter((f) => RAISABLE.includes(f.code)));
			emit({
				type: 'vitals_update',
				animalId: animal.id,
				at: nowIso(),
				vitals: normalVitalsFor(flag.code, animal)
			});
			emit({
				type: 'flag_cleared',
				animalId: animal.id,
				at: nowIso(),
				flagCode: flag.code,
				statusChangedTo: statusFromFlags(animal.flags.filter((f) => f !== flag))
			});
			return;
		}

		const candidates = animals.filter((a) => a.status === 'healthy' || a.status === 'watch');
		const animal = pick(candidates);
		if (!animal) return;
		const code = critical
			? 'TEMP_HIGH'
			: pick(RAISABLE.filter((c) => !animal.flags.some((f) => f.code === c)));
		if (!code) return;
		const flag = {
			code,
			severity: critical ? ('high' as const) : pickSeverity(),
			confidence: round(between(0.6, 0.97), 2)
		};
		emit({ type: 'vitals_update', animalId: animal.id, at: nowIso(), vitals: vitalsFor(code, animal) });
		emit({
			type: 'flag_raised',
			animalId: animal.id,
			at: nowIso(),
			flag,
			statusChangedTo: statusFromFlags([
				...animal.flags,
				{ ...flag, detectedAt: nowIso() }
			])
		});
	}

	function triggerSensorOffline() {
		const animal = pick(getAnimals().filter((a) => a.status !== 'no_signal'));
		if (animal) emit({ type: 'sensor_offline', animalId: animal.id, at: nowIso() });
	}

	function tick() {
		if (Date.now() >= nextFlagAt) {
			triggerFlag();
			nextFlagAt = Date.now() + between(20_000, 40_000);
		} else if (Math.random() < 0.03) {
			triggerSensorOffline();
		} else {
			emitVitalsTick();
		}
		timer = setTimeout(tick, between(2000, 5000));
	}

	return {
		connect(next) {
			this.disconnect();
			handlers = next;
			opening = setTimeout(() => {
				nextFlagAt = Date.now() + between(12_000, 25_000);
				handlers?.onOpen();
				timer = setTimeout(tick, between(2000, 5000));
			}, OPEN_DELAY_MS);
		},
		disconnect() {
			clearTimeout(opening);
			clearTimeout(timer);
			handlers = null;
		},
		triggerFlag,
		triggerSensorOffline
	};
}

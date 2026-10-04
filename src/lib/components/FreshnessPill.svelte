<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Wifi from '@lucide/svelte/icons/wifi';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import type { Freshness } from '../domain/freshness';
	import { formatAgeShort, formatClock } from '../domain/format';

	interface Props {
		freshness: Freshness;
		lastDataAt: number | null;
		now: number;
		/** Distinguishes "still connecting" from "nothing to show" when no data has arrived. */
		loading?: boolean;
	}

	let { freshness, lastDataAt, now, loading = false }: Props = $props();

	const age = $derived(lastDataAt === null ? '' : formatAgeShort(now - lastDataAt));

	const view = $derived(
		{
			live: { label: 'Live', tone: 'bg-live-bg text-live-fg border-live', icon: Wifi },
			delayed: { label: `Delayed · ${age}`, tone: 'bg-delayed-bg text-delayed-fg border-delayed', icon: Clock },
			stale: { label: `Stale · ${age}`, tone: 'bg-delayed-bg text-delayed-fg border-delayed', icon: Clock },
			offline: { label: 'Offline', tone: 'bg-offline-bg text-offline-fg border-offline', icon: WifiOff },
			unknown: loading
				? { label: 'Connecting', tone: 'bg-offline-bg text-offline-fg border-offline', icon: LoaderCircle }
				: { label: 'No data', tone: 'bg-offline-bg text-offline-fg border-offline', icon: WifiOff }
		}[freshness]
	);
	const Icon = $derived(view.icon);
</script>

<div class="flex min-w-0 items-center gap-3">
	<span
		class="inline-flex shrink-0 items-center gap-1.5 rounded-chip border-2 px-2.5 py-0.5 text-label font-bold {view.tone}"
	>
		<Icon
			size={16}
			aria-hidden="true"
			class={freshness === 'unknown' && loading ? 'motion-safe:animate-spin' : ''}
		/>
		{view.label}
	</span>
	{#if lastDataAt !== null}
		<span class="truncate text-caption text-content-muted">
			{freshness === 'live' ? 'Updated' : 'Last update'}
			{formatClock(lastDataAt, now)}
		</span>
	{/if}
</div>

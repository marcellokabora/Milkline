<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import type { Animal } from '../api/types';
	import { formatAgo } from '../domain/format';
	import { severityRank } from '../domain/priority';
	import FlagLine from './FlagLine.svelte';
	import StatusChip from './ui/StatusChip.svelte';
	import { STATUS_META } from './statusMeta';

	interface Props {
		animal: Animal;
		now: number;
		rank?: number;
		/** Data is old or the connection is down: soften the card so it does not read as current. */
		muted?: boolean;
		onopen: (id: string) => void;
	}

	let { animal, now, rank, muted = false, onopen }: Props = $props();

	const meta = $derived(STATUS_META[animal.status]);
	const flags = $derived(
		[...animal.flags].sort(
			(a, b) => severityRank([b]) - severityRank([a]) || b.confidence - a.confidence
		)
	);
	const shown = $derived(flags.slice(0, 3));
	const resolved = $derived(animal.status === 'healthy');
</script>

<article
	class="relative flex overflow-hidden rounded-card border-2 bg-surface transition-[filter] {meta.border} {muted
		? 'grayscale-[0.35]'
		: ''}"
>
	<span class="w-2.5 shrink-0 {meta.stripe}" aria-hidden="true"></span>
	<div class="flex min-w-0 flex-1 flex-col gap-3 p-4">
		<div class="flex items-center justify-between gap-3">
			<StatusChip status={animal.status} />
			{#if rank}
				<span class="text-label font-semibold text-content-muted">Priority {rank}</span>
			{/if}
		</div>

		<h3 class="text-title font-bold">
			<button
				type="button"
				class="min-h-touch-lg w-full text-left after:absolute after:inset-0 after:content-['']"
				onclick={() => onopen(animal.id)}
			>
				{animal.name}
				<span class="block text-body font-semibold text-content-muted">{animal.tag}</span>
			</button>
		</h3>

		<p class="flex items-center gap-2 text-title leading-tight font-semibold">
			<MapPin class="size-6 shrink-0 text-primary" aria-hidden="true" />
			<span>
				{animal.location.zone}
				<span class="block text-caption font-normal text-content-muted"
					>Seen {formatAgo(now - Date.parse(animal.location.lastSeen))}</span
				>
			</span>
		</p>

		{#if resolved}
			<p class="rounded-chip bg-status-healthy-bg px-3 py-2 text-label font-semibold text-status-healthy-fg">
				Back to normal. This card leaves the list on the next update.
			</p>
		{:else}
			<ul class="flex flex-col gap-3 border-t-2 border-border pt-3">
				{#each shown as flag (flag.code)}
					<FlagLine {flag} {animal} {now} />
				{/each}
				{#if flags.length > shown.length}
					<li class="text-label text-content-muted">+ {flags.length - shown.length} more</li>
				{/if}
			</ul>
		{/if}

		<div class="flex items-center justify-between text-label text-content-muted">
			<span>
				{#if animal.status === 'no_signal'}
					Silent since {formatAgo(now - Date.parse(animal.statusSince))}
				{:else if !resolved}
					Flagged {formatAgo(now - Date.parse(animal.statusSince))}
				{/if}
			</span>
			<span class="inline-flex items-center gap-1 font-semibold text-primary">
				Open <ChevronRight class="size-5" aria-hidden="true" />
			</span>
		</div>
	</div>
</article>

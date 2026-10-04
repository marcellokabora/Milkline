<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Animal } from '../api/types';
	import { describeFlag } from '../domain/flagCopy';
	import { formatAgo } from '../domain/format';
	import { compareByPriority } from '../domain/priority';
	import { highlightName, highlightTag, type TagSegment } from '../domain/search';
	import StatusChip from './ui/StatusChip.svelte';
	import { STATUS_META } from './statusMeta';

	interface Props {
		animal: Animal;
		now: number;
		muted?: boolean;
		/** Hide the status chip where the surrounding section already says it (e.g. "Healthy"). */
		showStatus?: boolean;
		/** The active search query, if any, so the matching part of the tag can be highlighted. */
		query?: string;
		onopen: (id: string) => void;
	}

	let { animal, now, muted = false, showStatus = true, query = '', onopen }: Props = $props();

	const meta = $derived(STATUS_META[animal.status]);
	const topFlag = $derived(animal.flags.length ? animal.flags[0] : null);
	const reason = $derived(topFlag ? describeFlag(topFlag, animal, now) : null);
	const extra = $derived(Math.max(0, animal.flags.length - 1));
	const tagSegments = $derived(highlightTag(animal.tag, query));
	const nameSegments = $derived(highlightName(animal.name, query));
</script>

<div
	class="relative flex min-h-touch-lg items-center gap-3 overflow-hidden rounded-card border-2 bg-surface pr-3 {meta.border} {muted
		? 'grayscale-[0.35]'
		: ''}"
>
	<span class="self-stretch w-2.5 shrink-0 {meta.stripe}" aria-hidden="true"></span>
	<div class="flex min-w-0 flex-1 flex-col py-2.5">
		{#snippet highlighted(segments: TagSegment[])}
			{#each segments as segment, i (i)}
				{#if segment.match}
					<mark class="rounded-sm bg-secondary px-0.5 text-secondary-foreground">{segment.text}</mark
					>
				{:else}
					{segment.text}
				{/if}
			{/each}
		{/snippet}
		<button
			type="button"
			class="block min-h-11 w-full truncate text-left text-body font-bold after:absolute after:inset-0 after:content-['']"
			onclick={() => onopen(animal.id)}
		>
			{@render highlighted(nameSegments)}
			<span class="font-semibold text-content-muted">· {@render highlighted(tagSegments)}</span>
		</button>
		<p class="text-label text-content-muted">
			{animal.location.zone}
			{#if animal.status === 'no_signal'}
				{#if extra}<span aria-hidden="true">·</span> + {extra} more{/if}
			{:else if reason}
				<span aria-hidden="true">·</span>
				{reason.title}{extra ? ` + ${extra} more` : ''}
			{:else}
				<span aria-hidden="true">·</span> seen {formatAgo(now - Date.parse(animal.location.lastSeen))}
			{/if}
		</p>
		{#if animal.status === 'no_signal'}
			<p class="text-caption text-content-muted">
				Last heard {formatAgo(now - Date.parse(animal.sensor.lastContact))}{animal.sensor.battery < 0.15
					? ` · Battery ${Math.round(animal.sensor.battery * 100)}%`
					: ''}
			</p>
		{/if}
	</div>
	{#if showStatus}
		<StatusChip status={animal.status} />
	{/if}
	<ChevronRight class="size-6 shrink-0 text-content-muted" aria-hidden="true" />
</div>

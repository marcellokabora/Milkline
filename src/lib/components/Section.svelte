<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		title: string;
		count: number;
		hint?: string;
		/** Collapsible sections hold long, low-priority lists (e.g. 112 healthy animals). */
		collapsible?: boolean;
		open?: boolean;
		children: Snippet;
	}

	let { id, title, count, hint, collapsible = false, open = $bindable(true), children }: Props =
		$props();

	const headingId = $derived(`${id}-heading`);
</script>

<section {id} aria-labelledby={headingId} class="flex scroll-mt-40 flex-col gap-3">
	{#if collapsible}
		<h2 id={headingId}>
			<button
				type="button"
				class="flex min-h-touch w-full items-center justify-between gap-3 rounded-card border-2 border-border bg-surface px-4 text-left"
				aria-expanded={open}
				aria-controls="{id}-body"
				onclick={() => (open = !open)}
			>
				<span class="text-title font-bold">
					{title}
					<span class="text-body font-semibold text-content-muted">· {count}</span>
				</span>
				<ChevronDown
					class="size-6 shrink-0 text-content-muted transition-transform {open ? 'rotate-180' : ''}"
					aria-hidden="true"
				/>
			</button>
		</h2>
	{:else}
		<div class="flex items-baseline justify-between gap-3 px-1">
			<h2 id={headingId} class="text-title font-bold">
				{title}
				<span class="text-body font-semibold text-content-muted">· {count}</span>
			</h2>
		</div>
		{#if hint}
			<p class="-mt-2 px-1 text-label text-content-muted">{hint}</p>
		{/if}
	{/if}
	{#if !collapsible || open}
		<div id="{id}-body" class="flex flex-col gap-3">
			{@render children()}
		</div>
	{/if}
</section>

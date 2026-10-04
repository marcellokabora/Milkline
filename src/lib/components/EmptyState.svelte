<script lang="ts">
	import Inbox from '@lucide/svelte/icons/inbox';
	import SearchX from '@lucide/svelte/icons/search-x';
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: 'inbox' | 'search';
		title: string;
		children?: Snippet;
	}

	let { icon = 'inbox', title, children }: Props = $props();
	const Icon = $derived(icon === 'search' ? SearchX : Inbox);
</script>

<div
	class="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-border-strong p-8 text-center"
>
	<Icon class="size-12 text-content-muted" aria-hidden="true" />
	<h2 class="text-title font-bold">{title}</h2>
	{#if children}
		<p class="text-body text-content-muted">{@render children()}</p>
	{/if}
</div>

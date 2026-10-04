<script module lang="ts">
	// Shared across every open sheet (module scope, not per-instance): `overflow: hidden` alone
	// still lets iOS Safari bounce-scroll the body behind a fixed overlay, so pin it in place and
	// restore the exact scroll position once the last sheet closes.
	let openSheets = 0;
	let savedScrollY = 0;
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		title: string;
		onclose: () => void;
		children: Snippet;
	}

	let { title, onclose, children }: Props = $props();

	// Svelte transitions run through the Web Animations API, so the CSS reduced-motion rule doesn't reach them.
	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const duration = reduceMotion ? 0 : 250;

	$effect(() => {
		if (openSheets === 0) {
			savedScrollY = window.scrollY;
			document.body.style.position = 'fixed';
			document.body.style.top = `-${savedScrollY}px`;
			document.body.style.left = '0';
			document.body.style.right = '0';
		}
		openSheets++;
		return () => {
			openSheets--;
			if (openSheets === 0) {
				document.body.style.position = '';
				document.body.style.top = '';
				document.body.style.left = '';
				document.body.style.right = '';
				window.scrollTo(0, savedScrollY);
			}
		};
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div class="fixed inset-0 z-40 flex items-end justify-center">
	<button
		type="button"
		class="absolute inset-0 bg-overlay"
		aria-label="Close"
		tabindex="-1"
		onclick={onclose}
		transition:fade={{ duration }}
	></button>
	<div
		role="dialog"
		aria-modal="true"
		aria-label={title}
		class="relative flex max-h-[90dvh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-t-card border-2 border-b-0 border-border-strong bg-surface-raised p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
		transition:fly={{ y: '100%', duration, easing: cubicOut, opacity: 1 }}
	>
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-title font-bold">{title}</h2>
			<button
				type="button"
				class="inline-flex size-touch items-center justify-center rounded-card border-2 border-border bg-surface"
				aria-label="Close"
				onclick={onclose}
			>
				<X class="size-6" aria-hidden="true" />
			</button>
		</div>
		{@render children()}
	</div>
</div>

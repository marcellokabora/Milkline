<script lang="ts">
	import { onMount } from 'svelte';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	let { value = $bindable('') }: { value?: string } = $props();

	let input: HTMLInputElement | undefined = $state();
	// Space hidden by the on-screen keyboard when the browser does not resize the layout viewport (iOS Safari).
	let keyboardInset = $state(0);

	onMount(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const update = () => {
			keyboardInset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
		};
		update();
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);
		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
		};
	});
</script>

<div
	class="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-surface-raised {keyboardInset
		? ''
		: 'pb-[env(safe-area-inset-bottom)]'}"
	style:bottom={keyboardInset ? `${keyboardInset}px` : undefined}
>
	<form
		class="relative mx-auto max-w-2xl p-3 lg:max-w-5xl"
		role="search"
		onsubmit={(e) => {
			e.preventDefault();
			input?.blur();
		}}
	>
		<label for="tag-search" class="sr-only">Find an animal by tag number</label>
		<Search
			class="pointer-events-none absolute top-1/2 left-7 size-6 -translate-y-1/2 text-content-muted"
			aria-hidden="true"
		/>
		<input
			id="tag-search"
			bind:this={input}
			bind:value
			type="search"
			enterkeyhint="search"
			autocomplete="off"
			autocapitalize="characters"
			spellcheck="false"
			placeholder="Find by tag, e.g. 0231"
			class="h-touch w-full rounded-card border-2 border-border-strong bg-surface pr-14 pl-12 text-body text-content placeholder:text-content-muted [&::-webkit-search-cancel-button]:hidden"
		/>
		{#if value}
			<button
				type="button"
				class="absolute top-1/2 right-3 inline-flex size-touch -translate-y-1/2 items-center justify-center rounded-card text-content"
				aria-label="Clear search"
				onclick={() => {
					value = '';
					input?.focus();
				}}
			>
				<X class="size-6" aria-hidden="true" />
			</button>
		{/if}
	</form>
</div>

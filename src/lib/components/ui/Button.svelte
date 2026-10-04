<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost';
		children: Snippet;
	}

	let { variant = 'primary', children, class: className = '', ...rest }: Props = $props();

	const styles = {
		primary: 'bg-primary text-primary-foreground border-primary',
		secondary: 'bg-secondary text-secondary-foreground border-border-strong',
		ghost: 'bg-surface text-content border-border-strong'
	};
</script>

<button
	type="button"
	class="inline-flex min-h-touch items-center justify-center gap-2 rounded-card border-2 px-5 text-body font-semibold active:brightness-90 disabled:opacity-60 {styles[
		variant
	]} {className}"
	{...rest}
>
	{@render children()}
</button>

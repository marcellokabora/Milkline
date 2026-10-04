<script lang="ts">
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	interface Props {
		count: number;
		critical: boolean;
		attention?: boolean;
		onapply: () => void;
	}

	let { count, critical, attention = false, onapply }: Props = $props();

	const srMessage = $derived(
		count > 0
			? `${count} ${count === 1 ? 'change' : 'changes'}${critical ? ', critical' : attention ? ', attention' : ''} waiting to update`
			: ''
	);
</script>

<!-- Icon button for the app bar, badged like a notification count rather than a full-width banner. -->
<div aria-live="polite">
	<span class="sr-only">{srMessage}</span>
	<button
		type="button"
		onclick={onapply}
		aria-label={count > 0
			? `${count} ${count === 1 ? 'change' : 'changes'}${critical ? ', critical' : attention ? ', attention' : ''}. Tap to update.`
			: 'No pending changes. Tap to refresh.'}
		class="relative inline-flex size-touch items-center justify-center rounded-card border-2 border-border bg-surface text-content active:brightness-90"
	>
		<RefreshCw class="size-6" aria-hidden="true" />
		{#if count > 0}
			<span
				aria-hidden="true"
				class="absolute -top-1.5 -right-1.5 inline-flex min-w-5 items-center justify-center rounded-full border-2 border-surface px-1 text-caption leading-tight font-bold {critical
					? 'bg-status-critical text-content-inverse'
					: attention
						? 'bg-status-attention text-status-attention-fg'
						: 'bg-primary text-primary-foreground'}"
			>
				{count}
			</span>
		{/if}
	</button>
</div>

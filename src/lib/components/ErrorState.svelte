<script lang="ts">
	import CloudOff from '@lucide/svelte/icons/cloud-off';
	import Button from './ui/Button.svelte';

	interface Props {
		message: string;
		offline: boolean;
		onretry: () => void;
	}

	let { message, offline, onretry }: Props = $props();
</script>

<div
	role="alert"
	class="flex flex-col items-center gap-4 rounded-card border-2 border-border-strong bg-surface p-6 text-center"
>
	<CloudOff class="size-12 text-content-muted" aria-hidden="true" />
	<div class="flex flex-col gap-1">
		<h2 class="text-title font-bold">
			{offline ? "You're offline" : "Couldn't load your herd"}
		</h2>
		<p class="text-body text-content-muted">{message}</p>
		<p class="text-body text-content-muted">
			{offline
				? 'No herd has been saved on this phone yet. Reconnect to see your animals.'
				: 'Nothing is saved on this phone yet, so there is nothing to show.'}
		</p>
	</div>
	<Button onclick={onretry} class="w-full">Try again</Button>
</div>

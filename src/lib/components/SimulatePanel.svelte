<script lang="ts">
	import { herd } from '../state/herd.svelte';
	import Button from './ui/Button.svelte';
	import Sheet from './ui/Sheet.svelte';

	let { onclose }: { onclose: () => void } = $props();

	const toggles = [
		{
			key: 'slow',
			label: 'Slow connection',
			hint: 'The next herd load takes about 3.5 s.'
		},
		{
			key: 'fail',
			label: 'Server failing',
			hint: 'The next herd load fails with a 503.'
		},
		{
			key: 'offline',
			label: 'No network',
			hint: 'Drops the stream and blocks requests right now.'
		},
		{
			key: 'stall',
			label: 'Silent stream',
			hint: 'Connection looks fine but nothing arrives. Data goes stale.'
		}
	] as const;
</script>

<Sheet title="Demo controls" {onclose}>
	<p class="text-label text-content-muted">
		Reproduce what a barn does to the app. Tip: <code>/?mock=slow</code>, <code>/?mock=fail</code> or
		<code>/?mock=offline</code> starts the page in that state.
	</p>

	<ul class="flex flex-col gap-3">
		{#each toggles as t (t.key)}
			<li>
				<button
					type="button"
					role="switch"
					aria-checked={herd.sim[t.key]}
					onclick={() => herd.setSimulation(t.key, !herd.sim[t.key])}
					class="flex min-h-touch w-full items-center justify-between gap-3 rounded-card border-2 bg-surface px-4 py-2 text-left {herd
						.sim[t.key]
						? 'border-primary'
						: 'border-border'}"
				>
					<span>
						<span class="block text-body font-bold">{t.label}</span>
						<span class="block text-label text-content-muted">{t.hint}</span>
					</span>
					<span
						class="shrink-0 rounded-chip border-2 px-3 py-1 text-label font-bold {herd.sim[t.key]
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border-strong text-content-muted'}"
					>
						{herd.sim[t.key] ? 'On' : 'Off'}
					</span>
				</button>
			</li>
		{/each}
	</ul>

	<div class="grid grid-cols-2 gap-3">
		<Button variant="secondary" onclick={() => herd.retry()}>Reload herd</Button>
		<Button variant="secondary" onclick={() => herd.clearSavedData()}>Clear saved data</Button>
		<Button variant="ghost" onclick={() => herd.triggerAlert(false)}>Raise an alert</Button>
		<Button variant="ghost" onclick={() => herd.triggerAlert(true)}>Raise a critical alert</Button>
	</div>
	<p class="text-caption text-content-muted">
		A copy of the herd is saved on this device, so a reload shows it straight away. Clear it, then
		reload, to see the full loading and error screens.
	</p>
</Sheet>

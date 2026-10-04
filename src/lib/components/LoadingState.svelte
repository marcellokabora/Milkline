<script lang="ts">
	import Skeleton from './ui/Skeleton.svelte';

	let { slow }: { slow: boolean } = $props();
</script>

<div class="flex flex-col gap-4" role="status" aria-live="polite" aria-busy="true">
	<p class="text-body font-semibold">
		{slow ? 'Still loading. The connection is slow, please keep this screen open.' : 'Loading your herd…'}
	</p>
	<Skeleton class="h-32" />
	<div class="grid grid-cols-3 gap-3">
		<Skeleton class="h-24" />
		<Skeleton class="h-24" />
		<Skeleton class="h-24" />
	</div>
	<Skeleton class="h-52" />
	<Skeleton class="h-52" />
</div>

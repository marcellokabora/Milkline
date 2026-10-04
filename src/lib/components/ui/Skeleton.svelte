<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<div class="animate-pulse rounded-chip bg-border {className}" aria-hidden="true"></div>

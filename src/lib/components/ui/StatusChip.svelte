<script lang="ts">
	import type { AnimalStatus } from '../../api/types';
	import { STATUS_META } from '../statusMeta';

	let { status, class: className = '' }: { status: AnimalStatus; class?: string } = $props();

	const meta = $derived(STATUS_META[status]);
	const Icon = $derived(meta.icon);
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-chip border-2 px-2.5 py-1 text-label font-bold {meta.tone} {className}"
>
	<Icon size={18} aria-hidden="true" />
	{meta.label}
</span>

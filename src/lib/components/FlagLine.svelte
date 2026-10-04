<script lang="ts">
	import type { Animal, Flag } from '../api/types';
	import { confidenceWord, describeFlag } from '../domain/flagCopy';
	import { FLAG_ICONS } from './statusMeta';

	let { flag, animal, now }: { flag: Flag; animal: Animal; now: number } = $props();

	const copy = $derived(describeFlag(flag, animal, now));
	const Icon = $derived(FLAG_ICONS[flag.code]);
</script>

<li class="flex items-start gap-3">
	<Icon class="mt-0.5 size-6 shrink-0 text-content-muted" aria-hidden="true" />
	<div class="min-w-0">
		<p class="text-body leading-snug font-semibold">
			{copy.title}
			{#if flag.code !== 'SENSOR_SILENT'}
				<span class="text-caption font-normal text-content-muted">· {confidenceWord(flag.confidence)}</span>
			{/if}
		</p>
		<p class="text-label text-content-muted">{copy.detail}</p>
	</div>
</li>

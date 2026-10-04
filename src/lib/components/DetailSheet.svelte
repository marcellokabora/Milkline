<script lang="ts">
  import type { Animal } from "../api/types";
  import FlagLine from "./FlagLine.svelte";
  import Sheet from "./ui/Sheet.svelte";
  import StatusChip from "./ui/StatusChip.svelte";

  interface Props {
    animal: Animal;
    now: number;
    onclose: () => void;
  }

  let { animal, now, onclose }: Props = $props();
</script>

<Sheet title="{animal.name} · {animal.tag}" {onclose}>
  <div class="flex flex-col gap-3">
    <StatusChip status={animal.status} class="self-start" />
    <p class="text-title font-semibold">{animal.location.zone}</p>
    {#if animal.flags.length}
      <ul class="flex flex-col gap-3">
        {#each animal.flags as flag (flag.code)}
          <FlagLine {flag} {animal} {now} />
        {/each}
      </ul>
    {/if}
    <p
      class="rounded-card border-2 border-dashed border-border-strong p-6 mt-2 text-label text-content-muted"
    >
      The animal detail view is out of scope for this take-home. This is the
      entry point it would open from.
    </p>
  </div>
</Sheet>

<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import type { Animal } from "../api/types";
  import { formatClock } from "../domain/format";
  import FlagLine from "./FlagLine.svelte";
  import Button from "./ui/Button.svelte";
  import Sheet from "./ui/Sheet.svelte";
  import StatusChip from "./ui/StatusChip.svelte";

  interface Props {
    animal: Animal;
    now: number;
    /** When the farmer marked this animal as seen today; null if not, or if something changed since. */
    seenAt: number | null;
    onacknowledge: () => void;
    onundo: () => void;
    onclose: () => void;
  }

  let { animal, now, seenAt, onacknowledge, onundo, onclose }: Props = $props();
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
    {#if animal.status !== "healthy"}
      {#if seenAt !== null}
        <div
          class="flex items-center justify-between gap-3 rounded-card border-2 border-status-healthy bg-status-healthy-bg px-4 py-2 text-status-healthy-fg"
        >
          <span class="inline-flex items-center gap-2 text-body font-semibold">
            <Check class="size-5 shrink-0" aria-hidden="true" />
            Seen at {formatClock(seenAt, now)}
          </span>
          <Button variant="ghost" onclick={onundo}>Undo</Button>
        </div>
      {:else}
        <Button onclick={onacknowledge}>
          <Check class="size-5" aria-hidden="true" />
          I've seen her
        </Button>
      {/if}
    {/if}
    <p
      class="rounded-card border-2 border-dashed border-border-strong p-6 mt-2 text-label text-content-muted"
    >
      The animal detail view is out of scope for this take-home. This is the
      entry point it would open from.
    </p>
  </div>
</Sheet>
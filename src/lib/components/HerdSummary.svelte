<script lang="ts" module>
  export type JumpTarget = "needs" | "watch" | "silent" | "healthy";
</script>

<script lang="ts">
  import OctagonAlert from "@lucide/svelte/icons/octagon-alert";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import Clock from "@lucide/svelte/icons/clock";
  import type { AnimalStatus } from "../api/types";
  import { formatClock } from "../domain/format";
  import { verdictFor } from "../domain/verdict";
  import { STATUS_META } from "./statusMeta";

  interface Props {
    counts: Record<AnimalStatus, number>;
    /** Freshness is not live: the verdict is last-known, not current, and must say so. */
    outdated: boolean;
    lastDataAt: number | null;
    now: number;
    onjump: (target: JumpTarget) => void;
  }

  let { counts, outdated, lastDataAt, now, onjump }: Props = $props();

  const verdict = $derived(verdictFor(counts));
  const verdictTone = $derived(
    {
      critical:
        "bg-status-critical-bg border-status-critical text-status-critical-fg",
      attention:
        "bg-status-attention-bg border-status-attention text-status-attention-fg",
      ok: "bg-status-healthy-bg border-status-healthy text-status-healthy-fg",
    }[verdict.tone],
  );
  const VerdictIcon = $derived(
    { critical: OctagonAlert, attention: TriangleAlert, ok: CircleCheck }[
      verdict.tone
    ],
  );

  const tiles: {
    status: "critical" | "attention" | "watch";
    target: JumpTarget;
  }[] = [
    { status: "critical", target: "needs" },
    { status: "attention", target: "needs" },
    { status: "watch", target: "watch" },
  ];
</script>

<section aria-labelledby="verdict" class="flex flex-col gap-3">
  <div
    class="flex items-center gap-2 rounded-card border-2 px-3 py-2 {verdictTone} {outdated
      ? 'grayscale-[0.4]'
      : ''}"
  >
    <VerdictIcon class="size-6 shrink-0" aria-hidden="true" />
    <h2
      id="verdict"
      class="min-w-0 flex-1 text-title font-extrabold wrap-break-word p-2"
    >
      {verdict.headline}{verdict.detail ? ` · ${verdict.detail}` : ""}
    </h2>
    {#if outdated && lastDataAt !== null}
      <span
        class="inline-flex shrink-0 items-center gap-1 text-label font-bold"
      >
        <Clock class="size-4" aria-hidden="true" />
        {formatClock(lastDataAt, now)}
      </span>
    {/if}
  </div>

  <ul class="grid grid-cols-3 gap-3">
    {#each tiles as tile (tile.status)}
      {@const meta = STATUS_META[tile.status]}
      {@const count = counts[tile.status]}
      <li>
        <button
          type="button"
          onclick={() => onjump(tile.target)}
          class="flex min-h-touch-lg w-full flex-col items-center justify-center gap-0.5 rounded-card border-2 px-2 py-3 {count >
          0
            ? meta.tone
            : 'border-border bg-surface text-content-muted'} {outdated
            ? 'grayscale-[0.4]'
            : ''}"
        >
          <span class="text-display leading-none font-extrabold">{count}</span>
          <span class="inline-flex items-center gap-1 text-label font-bold">
            <meta.icon size={16} aria-hidden="true" />
            {meta.label}
          </span>
        </button>
      </li>
    {/each}
  </ul>

  <div class="grid grid-cols-2 gap-3">
    <button
      type="button"
      class="min-h-touch rounded-card border-2 border-border bg-surface px-3 text-label font-semibold"
      onclick={() => onjump("silent")}
    >
      <span class="text-title font-bold">{counts.no_signal}</span>
      sensor{counts.no_signal === 1 ? "" : "s"} silent
    </button>
    <button
      type="button"
      class="min-h-touch rounded-card border-2 border-border bg-surface px-3 text-label font-semibold"
      onclick={() => onjump("healthy")}
    >
      <span class="text-title font-bold">{counts.healthy}</span>
      healthy
    </button>
  </div>
</section>

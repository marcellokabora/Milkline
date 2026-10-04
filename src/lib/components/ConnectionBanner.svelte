<script lang="ts">
  import LoaderCircle from "@lucide/svelte/icons/loader-circle";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import WifiOff from "@lucide/svelte/icons/wifi-off";
  import Clock from "@lucide/svelte/icons/clock";
  import { formatAgo, formatClock } from "../domain/format";
  import Button from "./ui/Button.svelte";

  interface Props {
    kind: "offline" | "unreachable" | "updating" | "stale";
    lastDataAt: number | null;
    now: number;
    savedCopy: boolean;
    onretry: () => void;
  }

  let { kind, lastDataAt, now, savedCopy, onretry }: Props = $props();

  const when = $derived(
    lastDataAt === null
      ? ""
      : `${formatClock(lastDataAt, now)} (${formatAgo(now - lastDataAt)})`,
  );

  const view = $derived(
    {
      offline: {
        icon: WifiOff,
        tone: "bg-offline-bg text-offline-fg border-offline",
        title: "You're offline",
        text: `Showing the herd as of ${when}.`,
        action: "Try again",
      },
      unreachable: {
        icon: TriangleAlert,
        tone: "bg-delayed-bg text-delayed-fg border-delayed",
        title: "Can't reach Milkline",
        text: `Showing the herd as of ${when}. Trying again automatically.`,
        action: "Try now",
      },
      updating: {
        icon: LoaderCircle,
        tone: "bg-delayed-bg text-delayed-fg border-delayed",
        title: "Updating…",
        text: `Showing ${savedCopy ? "saved data" : "data"} from ${when} until the latest arrives.`,
        action: null,
      },
      stale: {
        icon: Clock,
        tone: "bg-delayed-bg text-delayed-fg border-delayed",
        title: "No updates",
        text: `Last news was ${when}.`,
        action: "Refresh",
      },
    }[kind],
  );
  const Icon = $derived(view.icon);
</script>

<div role="status" class="border-b-2 {view.tone}">
  <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 lg:max-w-5xl">
    <Icon
      class="size-7 shrink-0 {kind === 'updating'
        ? 'motion-safe:animate-spin'
        : ''}"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p class="text-body font-bold">{view.title}</p>
      <p class="text-label text-balance">{view.text}</p>
    </div>
    {#if view.action}
      <Button variant="ghost" onclick={onretry} class="shrink-0 px-4!"
        >{view.action}</Button
      >
    {/if}
  </div>
</div>

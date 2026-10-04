<script lang="ts">
  import Download from "@lucide/svelte/icons/download";
  import FlaskConical from "@lucide/svelte/icons/flask-conical";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import type { Freshness } from "../domain/freshness";
  import FreshnessPill from "./FreshnessPill.svelte";
  import UpdatesPill from "./UpdatesPill.svelte";

  interface Props {
    title: string;
    subtitle: string;
    freshness: Freshness;
    lastDataAt: number | null;
    now: number;
    loading?: boolean;
    dark: boolean;
    updatesCount?: number;
    updatesCritical?: boolean;
    updatesAttention?: boolean;
    canInstall?: boolean;
    ontheme: () => void;
    ondemo: () => void;
    oninstall?: () => void;
    onapplyupdates: () => void;
  }

  let {
    title,
    subtitle,
    freshness,
    lastDataAt,
    now,
    loading = false,
    dark,
    updatesCount = 0,
    updatesCritical = false,
    updatesAttention = false,
    canInstall = false,
    oninstall,
    ontheme,
    ondemo,
    onapplyupdates,
  }: Props = $props();

  const iconButton =
    "inline-flex size-touch items-center justify-center rounded-card border-2 border-border bg-surface text-content active:brightness-90";
</script>

<header
  class="sticky top-0 z-20 border-b-2 border-border bg-bg/95 backdrop-blur"
>
  <div
    class="mx-auto flex max-w-2xl flex-col gap-1 px-4 pt-2 pb-2 lg:max-w-5xl"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="truncate text-title font-bold">{title}</h1>
        <p class="truncate text-caption text-content-muted">{subtitle}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        {#if import.meta.env.DEV}
          <button
            type="button"
            class={iconButton}
            onclick={ondemo}
            aria-label="Demo controls"
          >
            <FlaskConical class="size-6" aria-hidden="true" />
          </button>
        {/if}
        {#if canInstall}
          <button
            type="button"
            class={iconButton}
            onclick={oninstall}
            aria-label="Install Milkline as an app"
          >
            <Download class="size-6" aria-hidden="true" />
          </button>
        {/if}
        <button
          type="button"
          class={iconButton}
          onclick={ontheme}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {#if dark}
            <Sun class="size-6" aria-hidden="true" />
          {:else}
            <Moon class="size-6" aria-hidden="true" />
          {/if}
        </button>
        <UpdatesPill
          count={updatesCount}
          critical={updatesCritical}
          attention={updatesAttention}
          onapply={onapplyupdates}
        />
      </div>
    </div>
    <FreshnessPill {freshness} {lastDataAt} {now} {loading} />
  </div>
</header>

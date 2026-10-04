<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import AnimalCard from '#lib/components/AnimalCard.svelte';
	import AnimalRow from '#lib/components/AnimalRow.svelte';
	import AppBar from '#lib/components/AppBar.svelte';
	import ConnectionBanner from '#lib/components/ConnectionBanner.svelte';
	import DetailSheet from '#lib/components/DetailSheet.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import ErrorState from '#lib/components/ErrorState.svelte';
	import HerdSummary, { type JumpTarget } from '#lib/components/HerdSummary.svelte';
	import LoadingState from '#lib/components/LoadingState.svelte';
	import SearchBar from '#lib/components/SearchBar.svelte';
	import Section from '#lib/components/Section.svelte';
	import SimulatePanel from '#lib/components/SimulatePanel.svelte';
	import { herd } from '#lib/state/herd.svelte.js';
	import { pwa } from '#lib/state/pwa.svelte.js';
	import { theme } from '#lib/state/theme.svelte.js';

	let demoOpen = $state(false);
	let healthyOpen = $state(false);

	onMount(() => {
		const stopTheme = theme.init();
		const stopPwa = pwa.init();
		const stopHerd = herd.start(page.url.searchParams.get('mock'));
		return () => {
			stopHerd();
			stopTheme();
		};
	});

	// Anything that is not live must not look live: soften cards and qualify the verdict.
	const outdated = $derived(herd.freshness === 'stale' || herd.freshness === 'offline');
	const title = $derived(`Herd ${herd.herdId.replace('h_', '')}`);
	const showLoading = $derived(herd.loadState === 'idle' || herd.loadState === 'loading');

	async function jump(target: JumpTarget) {
		if (target === 'healthy') {
			healthyOpen = true;
			await tick();
		}
		const id = { needs: 'section-needs', watch: 'section-watch', silent: 'section-silent', healthy: 'section-healthy' }[target];
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// The list is replaced when the query changes, so the old scroll offset no longer means anything.
	let lastQuery = herd.query;
	$effect(() => {
		const query = herd.query.trim();
		if (query === lastQuery) return;
		lastQuery = query;
		window.scrollTo({ top: 0, behavior: 'instant' });
		// Mobile browsers may scroll the focused input into view after the list re-renders; reset again.
		requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	});

	function applyUpdates() {
		herd.query = '';
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
		herd.applyPending();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<AppBar
	{title}
	subtitle={herd.list.length ? `${herd.list.length} animals` : 'Herd overview'}
	freshness={herd.freshness}
	lastDataAt={herd.lastDataAt}
	now={herd.now}
	loading={showLoading}
	dark={theme.resolved === 'dark'}
	updatesCount={herd.isSearching ? 0 : herd.pendingIds.length}
	updatesCritical={herd.pendingHasCritical}
	updatesAttention={herd.pendingHasAttention}
	canInstall={pwa.canInstall}
	oninstall={() => pwa.install()}
	ontheme={() => theme.toggle()}
	ondemo={() => (demoOpen = true)}
	onapplyupdates={applyUpdates}
/>

{#if herd.bannerKind}
	<ConnectionBanner
		kind={herd.bannerKind}
		lastDataAt={herd.lastDataAt}
		now={herd.now}
		savedCopy={herd.fromCache}
		onretry={() => herd.retry()}
	/>
{/if}

<main class="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-4 pb-44 lg:max-w-5xl">
	{#if showLoading}
		<LoadingState slow={herd.loadSlow} />
	{:else if herd.loadState === 'error'}
		<ErrorState
			message={herd.lastError ?? 'Something went wrong.'}
			offline={!herd.online}
			onretry={() => herd.retry()}
		/>
	{:else if herd.list.length === 0}
		<EmptyState title="No animals in this herd yet">
			Once sensors are fitted and reporting, your animals will show up here.
		</EmptyState>
	{:else if herd.isSearching}
		<Section
			id="section-results"
			title={`Results for “${herd.query.trim()}”`}
			count={herd.results.length}
		>
			{#if herd.results.length === 0}
				<EmptyState icon="search" title="No animal matches that tag">
					Check the number on the ear tag. Typing just the last digits is enough.
				</EmptyState>
			{:else}
				<div class="grid gap-3 lg:grid-cols-2">
					{#each herd.results as animal (animal.id)}
						<AnimalRow
							{animal}
							now={herd.now}
							muted={outdated}
							query={herd.query}
							onopen={(id) => herd.open(id)}
						/>
					{/each}
				</div>
			{/if}
		</Section>
	{:else}
		<HerdSummary
			counts={herd.counts}
			{outdated}
			lastDataAt={herd.lastDataAt}
			now={herd.now}
			onjump={jump}
		/>

		<Section
			id="section-needs"
			title="Needs you today"
			count={herd.needsYou.length}
			hint={herd.needsYou.length ? 'Most urgent first.' : undefined}
		>
			{#if herd.needsYou.length === 0}
				<p class="rounded-card border-2 border-status-healthy bg-status-healthy-bg p-4 text-body font-semibold text-status-healthy-fg">
					No animals need you right now.
				</p>
			{:else}
				<div class="grid gap-3 lg:grid-cols-2">
					{#each herd.needsYou as animal, i (animal.id)}
						<AnimalCard
							{animal}
							rank={i + 1}
							now={herd.now}
							muted={outdated}
							onopen={(id) => herd.open(id)}
						/>
					{/each}
				</div>
			{/if}
		</Section>

		{#if herd.keepWatch.length}
			<Section
				id="section-watch"
				title="Keep an eye on"
				count={herd.keepWatch.length}
				hint="Not urgent, but worth a look on your round."
			>
				<div class="grid gap-3 lg:grid-cols-2">
					{#each herd.keepWatch as animal (animal.id)}
						<AnimalRow {animal} now={herd.now} muted={outdated} onopen={(id) => herd.open(id)} />
					{/each}
				</div>
			</Section>
		{/if}

		{#if herd.silent.length}
			<Section
				id="section-silent"
				title="Sensor offline"
				count={herd.silent.length}
				hint="We can't tell how these animals are doing. Check on them in person."
			>
				<div class="grid gap-3 lg:grid-cols-2">
					{#each herd.silent as animal (animal.id)}
						<AnimalRow {animal} now={herd.now} muted={outdated} onopen={(id) => herd.open(id)} />
					{/each}
				</div>
			</Section>
		{/if}

		<Section
			id="section-healthy"
			title="Healthy"
			count={herd.healthy.length}
			collapsible
			bind:open={healthyOpen}
		>
			<div class="grid gap-3 lg:grid-cols-2">
				{#each herd.healthy as animal (animal.id)}
					<AnimalRow
						{animal}
						now={herd.now}
						muted={outdated}
						showStatus={false}
						onopen={(id) => herd.open(id)}
					/>
				{/each}
			</div>
		</Section>
	{/if}
</main>

{#if herd.loadState === 'ready'}
	<SearchBar bind:value={herd.query} />
{/if}

{#if herd.selected}
	<DetailSheet animal={herd.selected} now={herd.now} onclose={() => herd.close()} />
{/if}

{#if import.meta.env.DEV && demoOpen}
	<SimulatePanel onclose={() => (demoOpen = false)} />
{/if}

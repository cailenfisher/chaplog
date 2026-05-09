<script lang="ts">
	import { MOCK_VIPS, completionsForDate, toDateStr } from '$lib/mock-caretaker';
	import VipCard from '$lib/components/caretaker/VipCard.svelte';

	const todayStr = toDateStr(new Date());

	// How many VIPs have completed every task today
	const allDoneCount = $derived(
		MOCK_VIPS.filter((v) => completionsForDate(v.completions, todayStr).length === v.tasks.length)
			.length
	);
</script>

<svelte:head>
	<title>ChapLog — Dashboard</title>
</svelte:head>

<!-- Page heading -->
<div class="mb-6">
	<h1 class="text-3xl font-bold text-slate-800">Dashboard</h1>
	<p class="mt-1 text-slate-500">Today's task progress across all your patients.</p>
</div>

<!-- Quick-stat strip -->
<div class="mb-8 flex gap-4">
	<div class="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
		<p class="text-xs font-medium uppercase tracking-wide text-slate-400">Patients</p>
		<p class="mt-0.5 text-3xl font-bold text-slate-800">{MOCK_VIPS.length}</p>
	</div>
	<div
		class="rounded-xl border px-5 py-4 shadow-sm
		       {allDoneCount === MOCK_VIPS.length
			? 'border-emerald-200 bg-emerald-50'
			: 'border-amber-100 bg-amber-50'}"
	>
		<p class="text-xs font-medium uppercase tracking-wide text-slate-400">All tasks done today</p>
		<p
			class="mt-0.5 text-3xl font-bold
			       {allDoneCount === MOCK_VIPS.length ? 'text-emerald-700' : 'text-amber-700'}"
		>
			{allDoneCount} / {MOCK_VIPS.length}
		</p>
	</div>
</div>

<!-- VIP cards -->
<section>
	<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Patients</h2>

	{#if MOCK_VIPS.length === 0}
		<div class="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
			No patients linked to your account yet.
		</div>
	{:else}
		<div class="space-y-4">
			{#each MOCK_VIPS as vip (vip.id)}
				<VipCard {vip} />
			{/each}
		</div>
	{/if}
</section>

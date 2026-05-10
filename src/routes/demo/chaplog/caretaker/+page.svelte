<script lang="ts">
	import { store } from '$lib/caretaker-store.svelte';
	import { completionsForDate, toDateStr } from '$lib/mock-caretaker';
	import type { VipSummary } from '$lib/mock-caretaker';
	import VipCard from '$lib/components/caretaker/VipCard.svelte';
	import VipForm from '$lib/components/caretaker/VipForm.svelte';

	const todayStr = toDateStr(new Date());

	const allDoneCount = $derived(
		store.vips.filter((v) => {
			const active = v.tasks.filter((t) => !t.deletedAt);
			if (active.length === 0) return false;
			return (
				completionsForDate(v.completions, todayStr).filter((c) =>
					active.some((t) => t.id === c.task_id)
				).length === active.length
			);
		}).length
	);

	let showAdd = $state(false);
	let editingVip = $state<VipSummary | null>(null);
</script>

<svelte:head>
	<title>ChapLog Demo — Dashboard</title>
</svelte:head>

<div class="mb-6 flex items-start justify-between gap-4">
	<div>
		<h1 class="text-3xl font-bold text-slate-800">Dashboard</h1>
		<p class="mt-1 text-slate-500">Today's task progress across all your patients.</p>
	</div>
	<button
		onclick={() => (showAdd = true)}
		class="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95"
	>
		+ Add patient
	</button>
</div>

<div class="mb-8 flex gap-4">
	<div class="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
		<p class="text-xs font-medium uppercase tracking-wide text-slate-400">Patients</p>
		<p class="mt-0.5 text-3xl font-bold text-slate-800">{store.vips.length}</p>
	</div>
	<div class="rounded-xl border px-5 py-4 shadow-sm {allDoneCount === store.vips.length && store.vips.length > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-100 bg-amber-50'}">
		<p class="text-xs font-medium uppercase tracking-wide text-slate-400">All tasks done today</p>
		<p class="mt-0.5 text-3xl font-bold {allDoneCount === store.vips.length && store.vips.length > 0 ? 'text-emerald-700' : 'text-amber-700'}">
			{allDoneCount} / {store.vips.length}
		</p>
	</div>
</div>

<section>
	<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Patients</h2>
	{#if store.vips.length === 0}
		<div class="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
			No patients linked to your account yet.
		</div>
	{:else}
		<div class="space-y-4">
			{#each store.vips as vip (vip.id)}
				<VipCard
					{vip}
					reportRoute="/demo/chaplog/caretaker/[vipId]"
					onEdit={() => (editingVip = vip)}
					onDelete={() => store.removeVip(vip.id)}
				/>
			{/each}
		</div>
	{/if}
</section>

{#if showAdd}
	<VipForm
		onSave={(d) => store.addVip({ display_name: d.display_name, activeThemeId: d.activeThemeId })}
		onclose={() => (showAdd = false)}
	/>
{/if}

{#if editingVip}
	<VipForm
		vip={editingVip}
		onSave={(d) => store.updateVip(editingVip!.id, { display_name: d.display_name, activeThemeId: d.activeThemeId })}
		onclose={() => (editingVip = null)}
	/>
{/if}

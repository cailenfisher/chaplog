<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import type { PageData } from './$types';
	import type { VipSummary } from '$lib/mock-caretaker';
	import { completionsForDate, toDateStr } from '$lib/mock-caretaker';
	import VipCard from '$lib/components/caretaker/VipCard.svelte';
	import VipForm from '$lib/components/caretaker/VipForm.svelte';

	let { data }: { data: PageData } = $props();

	const todayStr = toDateStr(new Date());

	const allDoneCount = $derived(
		data.vips.filter((v) => {
			const active = v.tasks.filter((t) => !t.deletedAt);
			if (active.length === 0) return false;
			return (
				completionsForDate(v.completions, todayStr).filter((c) =>
					active.some((t) => t.id === c.task_id)
				).length === active.length
			);
		}).length
	);

	let editingVip = $state<VipSummary | null>(null);

	async function handleVipSave(vipId: string, formData: { display_name: string; activeThemeId: string }) {
		const body = new FormData();
		body.set('vipId', vipId);
		body.set('display_name', formData.display_name);
		body.set('active_theme_id', formData.activeThemeId);

		const res = await fetch('?/updateVip', { method: 'POST', body });
		const result = deserialize(await res.text());
		if (result.type === 'success' || result.type === 'redirect') {
			await invalidateAll();
		}
	}
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
		<p class="mt-0.5 text-3xl font-bold text-slate-800">{data.vips.length}</p>
	</div>
	<div
		class="rounded-xl border px-5 py-4 shadow-sm
		       {allDoneCount === data.vips.length && data.vips.length > 0
			? 'border-emerald-200 bg-emerald-50'
			: 'border-amber-100 bg-amber-50'}"
	>
		<p class="text-xs font-medium uppercase tracking-wide text-slate-400">All tasks done today</p>
		<p
			class="mt-0.5 text-3xl font-bold
			       {allDoneCount === data.vips.length && data.vips.length > 0
				? 'text-emerald-700'
				: 'text-amber-700'}"
		>
			{allDoneCount} / {data.vips.length}
		</p>
	</div>
</div>

<!-- VIP cards -->
<section>
	<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Patients</h2>

	{#if data.vips.length === 0}
		<div class="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
			<p class="text-lg font-medium">No patients linked yet.</p>
			<p class="mt-1 text-sm">Ask an administrator to link patient accounts to your profile.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.vips as vip (vip.id)}
				<VipCard
					{vip}
					onEdit={() => (editingVip = vip)}
				/>
			{/each}
		</div>
	{/if}
</section>

{#if editingVip}
	<VipForm
		vip={editingVip}
		onSave={(formData) => handleVipSave(editingVip!.id, formData)}
		onclose={() => (editingVip = null)}
	/>
{/if}

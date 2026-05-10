<script lang="ts">
	import { page } from '$app/state';
	import { store } from '$lib/caretaker-store.svelte';
	import type { ReportTask } from '$lib/mock-caretaker';
	import {
		completionsForDate,
		completionsForRange,
		toDateStr,
		addDays,
		weekStart
	} from '$lib/mock-caretaker';
	import { SvelteDate } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import DailyReport from '$lib/components/caretaker/DailyReport.svelte';
	import WeeklyReport from '$lib/components/caretaker/WeeklyReport.svelte';
	import MonthlyReport from '$lib/components/caretaker/MonthlyReport.svelte';
	import TaskForm from '$lib/components/caretaker/TaskForm.svelte';

	const vip = $derived(store.vips.find((v) => v.id === page.params.vipId));
	const activeTasks = $derived(vip?.tasks.filter((t) => !t.deletedAt) ?? []);
	const deletedTasks = $derived(vip?.tasks.filter((t) => !!t.deletedAt) ?? []);

	type View = 'daily' | 'weekly' | 'monthly' | 'tasks';
	let activeView = $state<View>('daily');
	let pivot = new SvelteDate();

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const todayStr = toDateStr(today);

	const pivotDateStr = $derived(toDateStr(pivot));
	const wStart = $derived(weekStart(pivot));
	const wEnd = $derived(addDays(wStart, 6));
	const pivotYear = $derived(pivot.getFullYear());
	const pivotMonth = $derived(pivot.getMonth());

	const shownCompletions = $derived.by(() => {
		if (!vip) return [];
		if (activeView === 'daily') return completionsForDate(vip.completions, pivotDateStr);
		if (activeView === 'weekly')
			return completionsForRange(vip.completions, toDateStr(wStart), toDateStr(wEnd));
		const mStart = toDateStr(new Date(pivotYear, pivotMonth, 1));
		const mEnd = toDateStr(new Date(pivotYear, pivotMonth + 1, 0));
		return completionsForRange(vip.completions, mStart, mEnd);
	});

	const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

	const periodLabel = $derived.by(() => {
		if (activeView === 'daily') {
			if (pivotDateStr === todayStr) return 'Today';
			if (pivotDateStr === toDateStr(addDays(today, -1))) return 'Yesterday';
			return pivot.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
		}
		if (activeView === 'weekly') {
			const ws = wStart; const we = wEnd;
			if (ws.getMonth() === we.getMonth())
				return `${ws.toLocaleDateString('en-US', { month: 'long' })} ${ws.getDate()}–${we.getDate()}`;
			return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		}
		return `${MONTH_NAMES[pivotMonth]} ${pivotYear}`;
	});

	const canGoNext = $derived.by(() => {
		if (activeView === 'daily') return pivotDateStr < todayStr;
		if (activeView === 'weekly') return toDateStr(wStart) < toDateStr(weekStart(today));
		return pivotYear < today.getFullYear() || (pivotYear === today.getFullYear() && pivotMonth < today.getMonth());
	});

	function prev() {
		if (activeView === 'daily') pivot.setTime(addDays(pivot, -1).getTime());
		else if (activeView === 'weekly') pivot.setTime(addDays(pivot, -7).getTime());
		else pivot.setTime(new Date(pivotYear, pivotMonth - 1, 1).getTime());
	}
	function next() {
		if (!canGoNext) return;
		if (activeView === 'daily') pivot.setTime(addDays(pivot, 1).getTime());
		else if (activeView === 'weekly') pivot.setTime(addDays(pivot, 7).getTime());
		else pivot.setTime(new Date(pivotYear, pivotMonth + 1, 1).getTime());
	}
	function switchView(v: View) { activeView = v; pivot.setTime(Date.now()); }

	let showAddTask = $state(false);
	let editingTask = $state<ReportTask | null>(null);

	const IMPORTANCE_LABEL: Record<number, string> = { 1: 'Small', 2: 'Wide', 3: 'Large' };

	const REPORT_TABS: { view: View; label: string }[] = [
		{ view: 'daily', label: 'Daily' },
		{ view: 'weekly', label: 'Weekly' },
		{ view: 'monthly', label: 'Monthly' }
	];
</script>

<svelte:head>
	<title>ChapLog Demo — {vip?.display_name ?? 'Patient'} Report</title>
</svelte:head>

{#if !vip}
	<div class="py-24 text-center">
		<p class="text-5xl">🔍</p>
		<h2 class="mt-4 text-xl font-bold text-slate-700">Patient not found</h2>
		<a href={resolve('/demo/chaplog/caretaker')} class="mt-3 inline-block text-indigo-600 hover:underline">← Back to dashboard</a>
	</div>
{:else}
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<a href={resolve('/demo/chaplog/caretaker')} class="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600">← Dashboard</a>
			<h1 class="text-3xl font-bold text-slate-800">{vip.display_name}</h1>
			<p class="mt-0.5 text-slate-500">
				Task completion report
				<span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-500">{vip.activeThemeId} theme</span>
			</p>
		</div>
		<div class="grid h-14 w-14 place-items-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
			{vip.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
		</div>
	</div>

	<div class="mb-5 flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
		{#each REPORT_TABS as { view, label } (view)}
			<button onclick={() => switchView(view)} class="rounded-lg px-5 py-2 text-sm font-semibold transition-all {activeView === view ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}">{label}</button>
		{/each}
		<div class="mx-1 my-1 w-px bg-slate-200"></div>
		<button onclick={() => switchView('tasks')} class="rounded-lg px-5 py-2 text-sm font-semibold transition-all {activeView === 'tasks' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}">
			Tasks <span class="ml-1.5 rounded-full px-1.5 py-0.5 text-xs {activeView === 'tasks' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}">{activeTasks.length}</span>
		</button>
	</div>

	{#if activeView !== 'tasks'}
		<div class="mb-5 flex items-center gap-3">
			<button onclick={prev} class="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95" aria-label="Previous period">‹</button>
			<span class="min-w-56 text-center text-base font-semibold text-slate-800">{periodLabel}</span>
			<button onclick={next} disabled={!canGoNext} class="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next period">›</button>
			{#if !canGoNext}
				<span class="text-xs text-slate-400">current {activeView}</span>
			{:else}
				<button onclick={() => { pivot.setTime(Date.now()); }} class="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm hover:bg-slate-50">Today</button>
			{/if}
		</div>

		{#if activeView === 'daily'}
			<DailyReport tasks={activeTasks} completions={shownCompletions} />
		{:else if activeView === 'weekly'}
			<WeeklyReport tasks={activeTasks} completions={shownCompletions} weekStart={wStart} />
		{:else}
			<MonthlyReport tasks={activeTasks} completions={shownCompletions} year={pivotYear} month={pivotMonth} />
		{/if}

	{:else}
		<div class="mb-4 flex items-center justify-between">
			<p class="text-sm text-slate-500">Manage the tasks that appear on {vip.display_name}'s tablet.</p>
			<button onclick={() => (showAddTask = true)} class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95">+ Add task</button>
		</div>

		{#if activeTasks.length === 0 && deletedTasks.length === 0}
			<div class="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">No tasks yet.</div>
		{:else}
			<div class="space-y-2">
				{#each activeTasks as task (task.id)}
					<div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
						<span class="text-2xl">{task.icon}</span>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-slate-800">{task.name}</p>
							<p class="text-xs text-slate-400">{IMPORTANCE_LABEL[task.importance]} tile</p>
						</div>
						<div class="flex shrink-0 items-center gap-1">
							<button onclick={() => (editingTask = task)} class="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">Edit</button>
							<button onclick={() => { if (confirm(`Remove "${task.name}"?`)) store.softDeleteTask(vip!.id, task.id); }} class="rounded-md border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Remove</button>
						</div>
					</div>
				{/each}

				{#if deletedTasks.length > 0}
					<div class="mt-6">
						<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Removed tasks (history preserved)</p>
						<div class="space-y-2">
							{#each deletedTasks as task (task.id)}
								<div class="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 opacity-60">
									<span class="text-2xl grayscale">{task.icon}</span>
									<div class="min-w-0 flex-1">
										<p class="font-medium text-slate-500 line-through">{task.name}</p>
										<p class="text-xs text-slate-400">{IMPORTANCE_LABEL[task.importance]} tile · removed</p>
									</div>
									<button onclick={() => store.restoreTask(vip!.id, task.id)} class="shrink-0 rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">Restore</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	{#if showAddTask}
		<TaskForm onSave={(d) => { store.addTask(vip!.id, d); showAddTask = false; }} onclose={() => (showAddTask = false)} />
	{/if}

	{#if editingTask}
		<TaskForm task={editingTask} onSave={(d) => { store.updateTask(vip!.id, editingTask!.id, d); editingTask = null; }} onclose={() => (editingTask = null)} />
	{/if}
{/if}

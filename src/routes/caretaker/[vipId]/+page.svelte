<script lang="ts">
	import { page } from '$app/state';
	import { store } from '$lib/caretaker-store.svelte';
	import {
		completionsForDate,
		completionsForRange,
		toDateStr,
		addDays,
		weekStart,
		monthCalendar
	} from '$lib/mock-caretaker';
	import type { ReportTask } from '$lib/mock-caretaker';
	import DailyReport from '$lib/components/caretaker/DailyReport.svelte';
	import WeeklyReport from '$lib/components/caretaker/WeeklyReport.svelte';
	import MonthlyReport from '$lib/components/caretaker/MonthlyReport.svelte';
	import TaskForm from '$lib/components/caretaker/TaskForm.svelte';

	// Suppress unused import warning — monthCalendar is used indirectly via the store
	monthCalendar;

	// ── VIP lookup ────────────────────────────────────────────────────────────
	const vip = $derived(store.vips.find((v) => v.id === page.params.vipId));
	const activeTasks = $derived(vip?.tasks.filter((t) => !t.deletedAt) ?? []);
	const deletedTasks = $derived(vip?.tasks.filter((t) => !!t.deletedAt) ?? []);

	// ── View & navigation state ───────────────────────────────────────────────
	type View = 'daily' | 'weekly' | 'monthly' | 'tasks';
	let activeView = $state<View>('daily');

	// Single pivot date drives all report views
	let pivot = $state(new Date());

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = toDateStr(today);

	// ── Derived date ranges ───────────────────────────────────────────────────
	const pivotDateStr = $derived(toDateStr(pivot));
	const wStart = $derived(weekStart(pivot));
	const wEnd = $derived(addDays(wStart, 6));
	const pivotYear = $derived(pivot.getFullYear());
	const pivotMonth = $derived(pivot.getMonth());

	// ── Filtered completions ─────────────────────────────────────────────────
	const shownCompletions = $derived.by(() => {
		if (!vip) return [];
		if (activeView === 'daily') return completionsForDate(vip.completions, pivotDateStr);
		if (activeView === 'weekly')
			return completionsForRange(vip.completions, toDateStr(wStart), toDateStr(wEnd));
		const mStart = toDateStr(new Date(pivotYear, pivotMonth, 1));
		const mEnd = toDateStr(new Date(pivotYear, pivotMonth + 1, 0));
		return completionsForRange(vip.completions, mStart, mEnd);
	});

	// ── Period label ─────────────────────────────────────────────────────────
	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const periodLabel = $derived.by(() => {
		if (activeView === 'daily') {
			if (pivotDateStr === todayStr) return 'Today';
			if (pivotDateStr === toDateStr(addDays(today, -1))) return 'Yesterday';
			return pivot.toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric'
			});
		}
		if (activeView === 'weekly') {
			const ws = wStart;
			const we = wEnd;
			if (ws.getMonth() === we.getMonth()) {
				return `${ws.toLocaleDateString('en-US', { month: 'long' })} ${ws.getDate()}–${we.getDate()}`;
			}
			return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		}
		return `${MONTH_NAMES[pivotMonth]} ${pivotYear}`;
	});

	// ── Can we navigate forward? ─────────────────────────────────────────────
	const canGoNext = $derived.by(() => {
		if (activeView === 'daily') return pivotDateStr < todayStr;
		if (activeView === 'weekly') return toDateStr(wStart) < toDateStr(weekStart(today));
		return (
			pivotYear < today.getFullYear() ||
			(pivotYear === today.getFullYear() && pivotMonth < today.getMonth())
		);
	});

	// ── Navigation ───────────────────────────────────────────────────────────
	function prev() {
		if (activeView === 'daily') pivot = addDays(pivot, -1);
		else if (activeView === 'weekly') pivot = addDays(pivot, -7);
		else pivot = new Date(pivotYear, pivotMonth - 1, 1);
	}

	function next() {
		if (!canGoNext) return;
		if (activeView === 'daily') pivot = addDays(pivot, 1);
		else if (activeView === 'weekly') pivot = addDays(pivot, 7);
		else pivot = new Date(pivotYear, pivotMonth + 1, 1);
	}

	function goToday() {
		pivot = new Date();
	}

	function switchView(v: View) {
		activeView = v;
		pivot = new Date();
	}

	const REPORT_TABS: { view: View; label: string }[] = [
		{ view: 'daily', label: 'Daily' },
		{ view: 'weekly', label: 'Weekly' },
		{ view: 'monthly', label: 'Monthly' }
	];

	// ── Task management modal state ───────────────────────────────────────────
	let showAddTask = $state(false);
	let editingTask = $state<ReportTask | null>(null);

	function confirmDeleteTask(task: ReportTask) {
		if (confirm(`Remove "${task.name}"? Completion history will be preserved.`)) {
			store.softDeleteTask(vip!.id, task.id);
		}
	}

	const IMPORTANCE_LABEL: Record<number, string> = { 1: 'Small', 2: 'Wide', 3: 'Large' };
</script>

<svelte:head>
	<title>ChapLog — {vip?.display_name ?? 'Patient'} Report</title>
</svelte:head>

<!-- 404 state -->
{#if !vip}
	<div class="py-24 text-center">
		<p class="text-5xl">🔍</p>
		<h2 class="mt-4 text-xl font-bold text-slate-700">Patient not found</h2>
		<a href="/caretaker" class="mt-3 inline-block text-indigo-600 hover:underline">
			← Back to dashboard
		</a>
	</div>
{:else}
	<!-- ── Page header ──────────────────────────────────────────────────────── -->
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<a
				href="/caretaker"
				class="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
			>
				← Dashboard
			</a>
			<h1 class="text-3xl font-bold text-slate-800">{vip.display_name}</h1>
			<p class="mt-0.5 text-slate-500">
				Task completion report
				<span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-500">
					{vip.activeThemeId} theme
				</span>
			</p>
		</div>

		<!-- VIP avatar -->
		<div
			class="grid h-14 w-14 place-items-center rounded-full bg-indigo-100
			       text-xl font-bold text-indigo-700"
		>
			{vip.display_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
		</div>
	</div>

	<!-- ── Tab bar (reports + tasks) ──────────────────────────────────────── -->
	<div class="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
		{#each REPORT_TABS as { view, label }}
			<button
				onclick={() => switchView(view)}
				class="rounded-lg px-5 py-2 text-sm font-semibold transition-all
				       {activeView === view
					? 'bg-indigo-600 text-white shadow-sm'
					: 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
			>
				{label}
			</button>
		{/each}

		<!-- Divider -->
		<div class="mx-1 my-1 w-px bg-slate-200"></div>

		<button
			onclick={() => switchView('tasks')}
			class="rounded-lg px-5 py-2 text-sm font-semibold transition-all
			       {activeView === 'tasks'
				? 'bg-slate-800 text-white shadow-sm'
				: 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
		>
			Tasks
			<span
				class="ml-1.5 rounded-full px-1.5 py-0.5 text-xs
				       {activeView === 'tasks' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}"
			>
				{activeTasks.length}
			</span>
		</button>
	</div>

	<!-- ── Report views ─────────────────────────────────────────────────────── -->
	{#if activeView !== 'tasks'}
		<!-- Period navigation -->
		<div class="mb-5 flex items-center gap-3">
			<button
				onclick={prev}
				class="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white
				       text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95"
				aria-label="Previous period"
			>
				‹
			</button>

			<span class="min-w-56 text-center text-base font-semibold text-slate-800">
				{periodLabel}
			</span>

			<button
				onclick={next}
				disabled={!canGoNext}
				class="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white
				       text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95
				       disabled:cursor-not-allowed disabled:opacity-30"
				aria-label="Next period"
			>
				›
			</button>

			{#if !canGoNext}
				<span class="text-xs text-slate-400">current {activeView}</span>
			{:else}
				<button
					onclick={goToday}
					class="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5
					       text-xs font-medium text-slate-500 shadow-sm hover:bg-slate-50"
				>
					Today
				</button>
			{/if}
		</div>

		<!-- Report content -->
		{#if activeView === 'daily'}
			<DailyReport tasks={activeTasks} completions={shownCompletions} />
		{:else if activeView === 'weekly'}
			<WeeklyReport tasks={activeTasks} completions={shownCompletions} weekStart={wStart} />
		{:else}
			<MonthlyReport
				tasks={activeTasks}
				completions={shownCompletions}
				year={pivotYear}
				month={pivotMonth}
			/>
		{/if}

	{:else}
		<!-- ── Tasks management tab ────────────────────────────────────────────── -->
		<div class="flex items-center justify-between mb-4">
			<p class="text-sm text-slate-500">
				Manage the tasks that appear on {vip.display_name}'s tablet.
			</p>
			<button
				onclick={() => (showAddTask = true)}
				class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
				       shadow-sm hover:bg-indigo-700 active:scale-95"
			>
				+ Add task
			</button>
		</div>

		<!-- Active tasks -->
		{#if activeTasks.length === 0 && deletedTasks.length === 0}
			<div class="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
				No tasks yet. Add one to get started.
			</div>
		{:else}
			<div class="space-y-2">
				{#each activeTasks as task (task.id)}
					<div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
						<span class="text-2xl">{task.icon}</span>
						<div class="flex-1 min-w-0">
							<p class="font-medium text-slate-800">{task.name}</p>
							<p class="text-xs text-slate-400">{IMPORTANCE_LABEL[task.importance]} tile</p>
						</div>
						<div class="flex shrink-0 items-center gap-1">
							<button
								onclick={() => (editingTask = task)}
								class="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500
								       border border-slate-200 hover:bg-slate-50"
							>
								Edit
							</button>
							<button
								onclick={() => confirmDeleteTask(task)}
								class="rounded-md px-3 py-1.5 text-xs font-medium text-red-500
								       border border-red-100 hover:bg-red-50"
							>
								Remove
							</button>
						</div>
					</div>
				{/each}

				<!-- Soft-deleted tasks -->
				{#if deletedTasks.length > 0}
					<div class="mt-6">
						<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
							Removed tasks (history preserved)
						</p>
						<div class="space-y-2">
							{#each deletedTasks as task (task.id)}
								<div class="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 opacity-60">
									<span class="text-2xl grayscale">{task.icon}</span>
									<div class="flex-1 min-w-0">
										<p class="font-medium text-slate-500 line-through">{task.name}</p>
										<p class="text-xs text-slate-400">{IMPORTANCE_LABEL[task.importance]} tile · removed</p>
									</div>
									<button
										onclick={() => store.restoreTask(vip!.id, task.id)}
										class="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-indigo-600
										       border border-indigo-200 hover:bg-indigo-50"
									>
										Restore
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- ── Task modals ────────────────────────────────────────────────────────── -->
	{#if showAddTask}
		<TaskForm vipId={vip.id} onclose={() => (showAddTask = false)} />
	{/if}

	{#if editingTask}
		<TaskForm vipId={vip.id} task={editingTask} onclose={() => (editingTask = null)} />
	{/if}
{/if}

<script lang="ts">
	import { page } from '$app/state';
	import {
		MOCK_VIPS,
		completionsForDate,
		completionsForRange,
		toDateStr,
		addDays,
		weekStart,
		monthCalendar
	} from '$lib/mock-caretaker';
	import DailyReport from '$lib/components/caretaker/DailyReport.svelte';
	import WeeklyReport from '$lib/components/caretaker/WeeklyReport.svelte';
	import MonthlyReport from '$lib/components/caretaker/MonthlyReport.svelte';

	// ── VIP lookup ────────────────────────────────────────────────────────────
	const vip = $derived(MOCK_VIPS.find((v) => v.id === page.params.vipId));

	// ── View & navigation state ───────────────────────────────────────────────
	type View = 'daily' | 'weekly' | 'monthly';
	let activeView = $state<View>('daily');

	// Single pivot date drives all three views
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

	// Reset to "present" when switching view tabs
	function switchView(v: View) {
		activeView = v;
		pivot = new Date();
	}

	const TAB_LABELS: { view: View; label: string }[] = [
		{ view: 'daily', label: 'Daily' },
		{ view: 'weekly', label: 'Weekly' },
		{ view: 'monthly', label: 'Monthly' }
	];
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
			<p class="mt-0.5 text-slate-500">Task completion report</p>
		</div>

		<!-- VIP avatar -->
		<div
			class="grid h-14 w-14 place-items-center rounded-full bg-indigo-100
			       text-xl font-bold text-indigo-700"
		>
			{vip.display_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
		</div>
	</div>

	<!-- ── View tabs ────────────────────────────────────────────────────────── -->
	<div class="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
		{#each TAB_LABELS as { view, label }}
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
	</div>

	<!-- ── Period navigation ─────────────────────────────────────────────────── -->
	<div class="mb-5 flex items-center gap-3">
		<button
			onclick={prev}
			class="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white
			       text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95"
			aria-label="Previous period"
		>
			‹
		</button>

		<span class="min-w-[14rem] text-center text-base font-semibold text-slate-800">
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
			<!-- already at present — show a subtle label instead of a jump button -->
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

	<!-- ── Report content ───────────────────────────────────────────────────── -->
	{#if activeView === 'daily'}
		<DailyReport tasks={vip.tasks} completions={shownCompletions} />
	{:else if activeView === 'weekly'}
		<WeeklyReport tasks={vip.tasks} completions={shownCompletions} weekStart={wStart} />
	{:else}
		<MonthlyReport
			tasks={vip.tasks}
			completions={shownCompletions}
			year={pivotYear}
			month={pivotMonth}
		/>
	{/if}
{/if}

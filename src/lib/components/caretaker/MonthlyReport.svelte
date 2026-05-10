<script lang="ts">
	import type { ReportTask, Completion } from '$lib/mock-caretaker';
	import { monthCalendar, toDateStr } from '$lib/mock-caretaker';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		tasks: ReportTask[];
		/** Completions already filtered to this month. */
		completions: Completion[];
		year: number;
		month: number; // 0-indexed (JS Date convention)
	}

	let { tasks, completions, year, month }: Props = $props();

	const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const todayStr = toDateStr(new Date());
	const calendar = $derived(monthCalendar(year, month));

	// Map dateStr → completion count for that day
	const countByDate = $derived(
		(() => {
			const m = new SvelteMap<string, number>();
			for (const c of completions) m.set(c.completion_date, (m.get(c.completion_date) ?? 0) + 1);
			return m;
		})()
	);

	// Month-level stats
	const daysElapsed = $derived(
		(() => {
			const today = new Date();
			if (today.getFullYear() === year && today.getMonth() === month) return today.getDate();
			if (year < today.getFullYear() || month < today.getMonth()) {
				return new Date(year, month + 1, 0).getDate(); // whole month done
			}
			return 0; // future month
		})()
	);

	const monthTotal = $derived(completions.length);
	const monthPossible = $derived(tasks.length * daysElapsed);
	const monthPct = $derived(monthPossible > 0 ? Math.round((monthTotal / monthPossible) * 100) : 0);
	const perfectDays = $derived(
		[...countByDate.entries()].filter(([, n]) => n === tasks.length).length
	);
	const missedDays = $derived(
		[...countByDate.entries()].filter(([dateStr, n]) => n === 0 && dateStr <= todayStr).length
	);

	// Color class for a calendar cell
	function cellClass(count: number, isFuture: boolean): string {
		if (isFuture) return 'bg-slate-50 text-slate-300';
		if (count === 0) return 'bg-red-50 text-red-400';
		if (count === tasks.length) return 'bg-emerald-50 text-emerald-700';
		const pct = count / tasks.length;
		if (pct >= 0.75) return 'bg-teal-50 text-teal-700';
		return 'bg-amber-50 text-amber-700';
	}

	function countLabel(count: number, isFuture: boolean): string {
		if (isFuture) return '';
		return `${count}/${tasks.length}`;
	}
</script>

<!-- Month stats strip -->
<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
	{#each [
		{ label: 'Completed', value: `${monthTotal} / ${monthPossible}`, sub: `${monthPct}% rate`, color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
		{ label: 'Perfect days', value: String(perfectDays), sub: 'all tasks done', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
		{ label: 'Days tracked', value: String(daysElapsed), sub: `of ${new Date(year, month + 1, 0).getDate()}`, color: 'text-slate-700 bg-slate-50 border-slate-100' },
		{ label: 'Zero days', value: String(missedDays), sub: 'nothing completed', color: 'text-red-700 bg-red-50 border-red-100' }
	] as stat (stat.label)}
		<div class="rounded-xl border px-4 py-3 {stat.color}">
			<p class="text-xs font-medium opacity-70">{stat.label}</p>
			<p class="mt-0.5 text-xl font-bold">{stat.value}</p>
			<p class="text-xs opacity-60">{stat.sub}</p>
		</div>
	{/each}
</div>

<!-- Calendar grid -->
<div class="rounded-xl border border-slate-200 bg-white p-4">
	<!-- Day-of-week header -->
	<div class="mb-2 grid grid-cols-7 gap-1">
		{#each DAY_ABBR as abbr (abbr)}
			<div class="py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
				{abbr}
			</div>
		{/each}
	</div>

	<!-- Weeks -->
	{#each calendar as week, wi (wi)}
		<div class="mb-1 grid grid-cols-7 gap-1">
			{#each week as day, di (di)}
				{#if day}
					{@const dateStr = toDateStr(day)}
					{@const count = countByDate.get(dateStr) ?? 0}
					{@const isFuture = dateStr > todayStr}
					{@const isToday = dateStr === todayStr}
					<div
						class="flex min-h-18 flex-col rounded-xl p-2
						       {cellClass(count, isFuture)}
						       {isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}"
					>
						<span
							class="text-xs font-semibold leading-none
							       {isToday ? 'text-indigo-600' : ''}"
						>
							{day.getDate()}
						</span>
						{#if !isFuture}
							<span class="mt-auto text-center text-sm font-bold">
								{countLabel(count, isFuture)}
							</span>
						{/if}
					</div>
				{:else}
					<div class="min-h-18"></div>
				{/if}
			{/each}
		</div>
	{/each}

	<!-- Legend -->
	<div class="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
		{#each [
			{ color: 'bg-emerald-100', label: 'All done' },
			{ color: 'bg-teal-100', label: '≥ 75%' },
			{ color: 'bg-amber-100', label: '< 75%' },
			{ color: 'bg-red-100', label: 'None' },
			{ color: 'bg-slate-100', label: 'Future' }
		] as item (item.label)}
			<div class="flex items-center gap-1.5 text-xs text-slate-500">
				<div class="h-3 w-3 rounded-sm {item.color}"></div>
				{item.label}
			</div>
		{/each}
	</div>
</div>

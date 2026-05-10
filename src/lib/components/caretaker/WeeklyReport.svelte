<script lang="ts">
	import type { ReportTask, Completion } from '$lib/mock-caretaker';
	import { addDays, toDateStr } from '$lib/mock-caretaker';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		tasks: ReportTask[];
		/** Completions already filtered to the 7-day window. */
		completions: Completion[];
		/** Monday that starts the displayed week. */
		weekStart: Date;
	}

	let { tasks, completions, weekStart }: Props = $props();

	const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const todayStr = toDateStr(new Date());

	// The 7 calendar dates of the week
	const days = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));
	const dayStrs = $derived(days.map(toDateStr));

	// Nested lookup: dateStr → task_id → Completion
	const idx = $derived(
		(() => {
			const m = new SvelteMap<string, SvelteMap<string, Completion>>();
			for (const c of completions) {
				if (!m.has(c.completion_date)) m.set(c.completion_date, new SvelteMap());
				m.get(c.completion_date)!.set(c.task_id, c);
			}
			return m;
		})()
	);

	// Per-day completion count for the footer
	const dailyTotals = $derived(dayStrs.map((ds) => (idx.get(ds)?.size ?? 0)));

	// Week-level totals
	const weekTotal = $derived(dailyTotals.reduce((a, b) => a + b, 0));
	const weekPossible = $derived(tasks.length * 7);
	const weekPct = $derived(weekPossible > 0 ? Math.round((weekTotal / weekPossible) * 100) : 0);

	function fmtDay(date: Date) {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function fmtTime(iso: string) {
		return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
</script>

<!-- Week summary -->
<div class="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
	<span class="text-sm font-medium text-slate-600">
		Week total: <strong class="text-slate-800">{weekTotal} / {weekPossible}</strong> completions
	</span>
	<span
		class="text-sm font-bold
		       {weekPct >= 90 ? 'text-emerald-600' : weekPct >= 60 ? 'text-amber-600' : 'text-red-500'}"
	>
		{weekPct}%
	</span>
</div>

<!-- Responsive table -->
<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
	<table class="w-full min-w-160 text-sm">
		<!-- Column headers -->
		<thead class="border-b border-slate-100">
			<tr>
				<th class="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
					Task
				</th>
				{#each days as day, i (i)}
					<th
						class="px-2 py-3 text-center
						       {dayStrs[i] === todayStr ? 'text-indigo-600' : 'text-slate-500'}"
					>
						<div class="text-xs font-medium">{DAY_ABBR[i]}</div>
						<div class="mt-0.5 text-xs font-semibold">{fmtDay(day)}</div>
					</th>
				{/each}
			</tr>
		</thead>

		<!-- Task rows -->
		<tbody class="divide-y divide-slate-50">
			{#each tasks as task (task.id)}
				<tr class="hover:bg-slate-50/60">
					<td class="px-4 py-3">
						<div class="flex items-center gap-2">
							<span class="text-lg">{task.icon}</span>
							<span class="font-medium text-slate-700">{task.name}</span>
						</div>
					</td>
					{#each dayStrs as dateStr (dateStr)}
						{@const c = idx.get(dateStr)?.get(task.id)}
						{@const isFuture = dateStr > todayStr}
						<td class="px-2 py-3 text-center">
							{#if isFuture}
								<div class="mx-auto h-8 w-8 rounded-full bg-slate-50"></div>
							{:else if c}
								<div class="flex flex-col items-center gap-0.5">
									<div
										class="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
									>
										✓
									</div>
									<span class="text-[10px] text-slate-400">{fmtTime(c.completed_at)}</span>
								</div>
							{:else}
								<div class="mx-auto h-8 w-8 rounded-full border-2 border-slate-200"></div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>

		<!-- Daily totals footer -->
		<tfoot class="border-t-2 border-slate-200">
			<tr>
				<td class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
					Daily total
				</td>
				{#each dailyTotals as n, i (i)}
					<td class="px-2 py-3 text-center">
						<span
							class="text-sm font-bold
							       {n === tasks.length
								? 'text-emerald-600'
								: n === 0
									? 'text-red-400'
									: 'text-amber-600'}"
						>
							{n}/{tasks.length}
						</span>
					</td>
				{/each}
			</tr>
		</tfoot>
	</table>
</div>

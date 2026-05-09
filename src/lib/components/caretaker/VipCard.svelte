<script lang="ts">
	import type { VipSummary } from '$lib/mock-caretaker';
	import { completionsForDate, toDateStr, addDays } from '$lib/mock-caretaker';
	import TaskPerformanceChart from './TaskPerformanceChart.svelte';

	interface Props {
		vip: VipSummary;
	}

	let { vip }: Props = $props();

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = toDateStr(today);

	const done = $derived(completionsForDate(vip.completions, todayStr).length);
	const total = $derived(vip.tasks.length);
	const pct = $derived(total > 0 ? (done / total) * 100 : 0);
	const allDone = $derived(done === total);
	const noneStarted = $derived(done === 0);

	const initials = $derived(
		vip.display_name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);

	const barColor = $derived(
		allDone ? 'bg-emerald-500' : noneStarted ? 'bg-red-400' : 'bg-amber-400'
	);
	const statusText = $derived(allDone ? 'All done! ✓' : `${done} of ${total} tasks`);
	const statusColor = $derived(
		allDone ? 'text-emerald-600' : noneStarted ? 'text-red-500' : 'text-amber-600'
	);

	// Last 7 day strings, newest first (for alert streak detection)
	const last7 = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(today, -i)));

	const completedByTask = $derived(
		(() => {
			const m = new Map<string, Set<string>>();
			for (const task of vip.tasks) m.set(task.id, new Set<string>());
			for (const c of vip.completions) m.get(c.task_id)?.add(c.completion_date);
			return m;
		})()
	);

	interface Alert {
		task: (typeof vip.tasks)[0];
		misses7d: number;
		streak: number;
	}

	const alerts = $derived(
		(() => {
			const result: Alert[] = [];
			for (const task of vip.tasks) {
				const doneSet = completedByTask.get(task.id) ?? new Set<string>();
				const misses7d = last7.filter((d) => !doneSet.has(d)).length;
				let streak = 0;
				for (const d of last7) {
					if (!doneSet.has(d)) streak++;
					else break;
				}
				if (misses7d >= 3 || streak >= 2) result.push({ task, misses7d, streak });
			}
			return result.sort((a, b) => b.misses7d - a.misses7d);
		})()
	);
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- ── Left panel ──────────────────────────────────────────────────────── -->
		<div class="flex shrink-0 flex-col gap-4 lg:w-64">
			<!-- Avatar + name + status -->
			<div class="flex items-center gap-4">
				<div
					class="grid h-14 w-14 shrink-0 place-items-center rounded-full
					       bg-indigo-100 text-xl font-bold text-indigo-700"
				>
					{initials}
				</div>
				<div class="min-w-0 flex-1">
					<h3 class="truncate text-xl font-bold text-slate-800">{vip.display_name}</h3>
					<span class="text-sm font-medium {statusColor}">{statusText}</span>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="space-y-1.5">
				<div class="flex justify-between text-xs text-slate-400">
					<span>Today's progress</span>
					<span>{Math.round(pct)}%</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-slate-100">
					<div
						class="{barColor} h-full rounded-full transition-all duration-500"
						style="width:{pct}%;"
					></div>
				</div>
			</div>

			<!-- Task pills -->
			<div class="flex flex-wrap gap-1.5">
				{#each vip.tasks as task}
					{@const completed = completionsForDate(vip.completions, todayStr).some(
						(c) => c.task_id === task.id
					)}
					<span
						class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
						       {completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}"
					>
						{task.icon}
						{task.name}
					</span>
				{/each}
			</div>

			<!-- Report link -->
			<a
				href="/caretaker/{vip.id}"
				class="text-sm font-medium text-indigo-500 transition-colors hover:text-indigo-700"
			>
				View full report →
			</a>
		</div>

		<!-- ── Divider (desktop only) ──────────────────────────────────────────── -->
		<div class="hidden self-stretch lg:block">
			<div class="h-full w-px bg-slate-100"></div>
		</div>

		<!-- ── Right panel: chart + alerts ────────────────────────────────────── -->
		<div class="flex min-w-0 flex-1 flex-col gap-4">
			<div>
				<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
					7-day rolling completion · 30 days
				</p>
				<TaskPerformanceChart tasks={vip.tasks} completions={vip.completions} />
			</div>

			{#if alerts.length > 0}
				<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
						Attention needed
					</p>
					<div class="flex flex-col gap-1.5">
						{#each alerts as a}
							<div class="flex items-center gap-2 text-sm">
								<span>{a.task.icon}</span>
								<span class="font-medium text-amber-900">{a.task.name}</span>
								<span class="ml-auto text-xs text-amber-600">
									{a.misses7d}/7 missed{#if a.streak >= 2} · {a.streak}-day streak{/if}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

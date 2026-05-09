<script lang="ts">
	import type { VipSummary } from '$lib/mock-caretaker';
	import { completionsForDate, toDateStr, addDays } from '$lib/mock-caretaker';
	import TaskPerformanceChart from './TaskPerformanceChart.svelte';

	interface Props {
		vip: VipSummary;
		onEdit: () => void;
		onDelete: () => void;
	}

	let { vip, onEdit, onDelete }: Props = $props();

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = toDateStr(today);

	const activeTasks = $derived(vip.tasks.filter((t) => !t.deletedAt));
	const done = $derived(
		completionsForDate(vip.completions, todayStr).filter((c) =>
			activeTasks.some((t) => t.id === c.task_id)
		).length
	);
	const total = $derived(activeTasks.length);
	const pct = $derived(total > 0 ? (done / total) * 100 : 0);
	const allDone = $derived(done === total && total > 0);
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
	const statusText = $derived(
		total === 0 ? 'No tasks' : allDone ? 'All done! ✓' : `${done} of ${total} tasks`
	);
	const statusColor = $derived(
		total === 0
			? 'text-slate-400'
			: allDone
				? 'text-emerald-600'
				: noneStarted
					? 'text-red-500'
					: 'text-amber-600'
	);

	// Last 7 day strings, newest first (for alert streak detection)
	const last7 = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(today, -i)));

	const completedByTask = $derived(
		(() => {
			const m = new Map<string, Set<string>>();
			for (const task of activeTasks) m.set(task.id, new Set<string>());
			for (const c of vip.completions) m.get(c.task_id)?.add(c.completion_date);
			return m;
		})()
	);

	interface Alert {
		task: (typeof activeTasks)[0];
		misses7d: number;
		streak: number;
	}

	const alerts = $derived(
		(() => {
			const result: Alert[] = [];
			for (const task of activeTasks) {
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

	function confirmDelete() {
		if (confirm(`Remove ${vip.display_name}? This cannot be undone.`)) onDelete();
	}
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- ── Left panel ──────────────────────────────────────────────────────── -->
		<div class="flex shrink-0 flex-col gap-4 lg:w-64">
			<!-- Avatar + name + status + actions -->
			<div class="flex items-start gap-4">
				<div
					class="grid h-14 w-14 shrink-0 place-items-center rounded-full
					       bg-indigo-100 text-xl font-bold text-indigo-700"
				>
					{initials}
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<h3 class="truncate text-xl font-bold text-slate-800">{vip.display_name}</h3>
						<!-- Edit / Delete buttons -->
						<button
							onclick={onEdit}
							class="ml-auto shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
							title="Edit patient"
							aria-label="Edit patient"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
								/>
							</svg>
						</button>
						<button
							onclick={confirmDelete}
							class="shrink-0 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
							title="Remove patient"
							aria-label="Remove patient"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
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

			<!-- Task pills (active only) -->
			<div class="flex flex-wrap gap-1.5">
				{#each activeTasks as task}
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
				{#if activeTasks.length === 0}
					<span class="text-xs text-slate-400 italic">No tasks yet</span>
				{/if}
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
				<TaskPerformanceChart tasks={activeTasks} completions={vip.completions} />
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

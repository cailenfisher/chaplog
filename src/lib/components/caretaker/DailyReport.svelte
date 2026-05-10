<script lang="ts">
	import type { ReportTask, Completion } from '$lib/mock-caretaker';

	interface Props {
		tasks: ReportTask[];
		/** Completions already filtered to the selected date. */
		completions: Completion[];
	}

	let { tasks, completions }: Props = $props();

	// Map task_id → completion for O(1) lookup
	const byTask = $derived(new Map(completions.map((c) => [c.task_id, c])));

	// Sort: completed tasks first (chronological), then incomplete
	const sorted = $derived([
		...tasks
			.filter((t) => byTask.has(t.id))
			.sort((a, b) =>
				(byTask.get(a.id)?.completed_at ?? '').localeCompare(byTask.get(b.id)?.completed_at ?? '')
			),
		...tasks.filter((t) => !byTask.has(t.id))
	]);

	const completedCount = $derived(completions.length);
	const pct = $derived(tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0);

	function fmt(iso: string) {
		return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
</script>

<!-- Summary bar -->
<div
	class="mb-4 flex items-center justify-between rounded-xl border px-4 py-3
	       {completedCount === tasks.length
		? 'border-emerald-200 bg-emerald-50'
		: completedCount === 0
			? 'border-red-100 bg-red-50'
			: 'border-amber-100 bg-amber-50'}"
>
	<span class="text-sm font-semibold text-slate-700">
		{completedCount} of {tasks.length} tasks completed
	</span>
	<span
		class="text-sm font-bold
		       {completedCount === tasks.length
			? 'text-emerald-600'
			: completedCount === 0
				? 'text-red-500'
				: 'text-amber-600'}"
	>
		{pct}%
	</span>
</div>

<!-- Task list -->
<div class="space-y-2">
	{#each sorted as task (task.id)}
		{@const c = byTask.get(task.id)}
		<div
			class="flex items-start gap-4 rounded-xl border p-4
			       {c ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white'}"
		>
			<!-- Icon -->
			<span class="mt-0.5 text-2xl leading-none">{task.icon}</span>

			<!-- Content -->
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<span class="font-semibold text-slate-800">{task.name}</span>
					{#if c}
						<span class="text-sm font-medium text-emerald-700">✓ {fmt(c.completed_at)}</span>
					{:else}
						<span class="text-sm text-slate-400">Not completed</span>
					{/if}
				</div>

				{#if c?.encouragement_shown}
					<p class="mt-1 text-sm italic text-slate-500">"{c.encouragement_shown}"</p>
				{/if}

				{#if c?.notes}
					<p class="mt-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
						📝 {c.notes}
					</p>
				{/if}
			</div>

			<!-- Status circle -->
			<div class="mt-0.5 shrink-0">
				{#if c}
					<div
						class="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white"
					>
						✓
					</div>
				{:else}
					<div class="h-6 w-6 rounded-full border-2 border-slate-200"></div>
				{/if}
			</div>
		</div>
	{/each}
</div>

{#if tasks.length === 0}
	<p class="py-12 text-center text-slate-400">No tasks defined for this patient.</p>
{/if}

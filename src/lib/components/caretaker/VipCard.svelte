<script lang="ts">
	import type { VipSummary } from '$lib/mock-caretaker';
	import { completionsForDate, toDateStr } from '$lib/mock-caretaker';

	interface Props {
		vip: VipSummary;
	}

	let { vip }: Props = $props();

	const todayStr = toDateStr(new Date());
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
	const statusText = $derived(
		allDone ? 'All done! ✓' : `${done} of ${total} tasks`
	);
	const statusColor = $derived(
		allDone ? 'text-emerald-600' : noneStarted ? 'text-red-500' : 'text-amber-600'
	);
</script>

<a
	href="/caretaker/{vip.id}"
	class="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6
	       shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
>
	<!-- Header: avatar + name + status badge -->
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
				style="width: {pct}%;"
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
				       {completed
					? 'bg-emerald-50 text-emerald-700'
					: 'bg-slate-100 text-slate-400'}"
			>
				{task.icon}
				{task.name}
			</span>
		{/each}
	</div>

	<!-- Footer link -->
	<div class="flex justify-end">
		<span
			class="text-sm font-medium text-indigo-500 transition-colors
			       group-hover:text-indigo-700"
		>
			View full report →
		</span>
	</div>
</a>

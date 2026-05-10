<script lang="ts">
	import { untrack } from 'svelte';
	import type { Task } from '$lib/tasks';
	import { THEMES } from '$lib/themes/registry';
	import TaskTileController from './TaskTileController.svelte';

	interface Props {
		tasks: Task[];
		themeId?: string;
		/** task_id → encouragement for tasks already completed today (server-loaded) */
		completedToday?: Record<string, string>;
		onTaskComplete?: (taskId: string, encouragement: string) => void;
	}

	let { tasks, themeId = 'friendly', completedToday = {}, onTaskComplete }: Props = $props();

	const theme = $derived(THEMES[themeId] ?? THEMES.friendly);
	const Grid = $derived(theme.Grid);
	const AllDone = $derived(theme.AllDone);

	// Start count from pre-completed tasks so AllDone fires correctly on load
	let completedCount = $state(untrack(() => Object.keys(completedToday).length));
	const allDone = $derived(tasks.length > 0 && completedCount >= tasks.length);

	function handleComplete(taskId: string, encouragement: string) {
		completedCount += 1;
		onTaskComplete?.(taskId, encouragement);
	}
</script>

<Grid>
	{#if tasks.length > 0}
		{#each tasks as task (task.id)}
			<TaskTileController
				{task}
				{theme}
				initialCompleted={task.id in completedToday}
				initialEncouragement={completedToday[task.id] ?? ''}
				onComplete={handleComplete}
			/>
		{/each}
	{:else}
		<div class="text-xl text-red-500">No tasks assigned!</div>
	{/if}
</Grid>

{#if allDone}
	<AllDone />
{/if}

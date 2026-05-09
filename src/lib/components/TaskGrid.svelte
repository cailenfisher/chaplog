<script lang="ts">
	import { TASKS } from '$lib/tasks';
	import { THEMES } from '$lib/themes/registry';
	import TaskTileController from './TaskTileController.svelte';

	interface Props {
		themeId?: string;
	}

	let { themeId = 'friendly' }: Props = $props();

	const theme = $derived(THEMES[themeId] ?? THEMES.friendly);
	const Grid = $derived(theme.Grid);
	const AllDone = $derived(theme.AllDone);

	let completedCount = $state(0);
	const allDone = $derived(completedCount === TASKS.length);

	function handleComplete(_taskId: string) {
		completedCount += 1;
	}
</script>

<Grid>
	{#each TASKS as task (task.id)}
		<TaskTileController {task} {theme} onComplete={handleComplete} />
	{/each}
</Grid>

{#if allDone}
	<AllDone />
{/if}

<script lang="ts">
	import { TASKS } from '$lib/tasks';
	import TaskTile from './TaskTile.svelte';
	import { fade } from 'svelte/transition';

	let completedCount = $state(0);

	function handleComplete(_taskId: string) {
		completedCount += 1;
	}

	const allDone = $derived(completedCount === TASKS.length);
</script>

<!--
  4 cols × 3 rows fills the screen exactly for the default 5 tasks.
  grid-rows-3 splits height into three equal bands.
  CSS Grid auto-placement handles the varying col/row spans from TaskTile.
-->
<div
	class="w-screen h-screen overflow-hidden bg-slate-900
	       grid grid-cols-4 grid-rows-3 gap-2 p-2"
>
	{#each TASKS as task (task.id)}
		<TaskTile {task} onComplete={handleComplete} />
	{/each}
</div>

<!-- All-done celebration overlay -->
{#if allDone}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center
		       bg-black/75 backdrop-blur-sm"
		transition:fade={{ duration: 400 }}
	>
		<div class="text-center px-8 select-none">
			<div class="animate-bounce" style="font-size: clamp(6rem, 15vw, 12rem);">🎉</div>
			<h1
				class="text-white font-bold mt-6 leading-tight"
				style="font-size: clamp(2.5rem, 6vw, 5rem);"
			>
				All done for today!
			</h1>
			<p class="text-white/70 mt-3" style="font-size: clamp(1.4rem, 3vw, 2.5rem);">
				You did an absolutely amazing job! 🌟
			</p>
		</div>
	</div>
{/if}

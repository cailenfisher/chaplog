<script lang="ts">
	import type { PageData } from './$types';
	import TaskGrid from '$lib/components/TaskGrid.svelte';

	let { data }: { data: PageData } = $props();

	async function handleTaskComplete(taskId: string, encouragement: string) {
		const body = new FormData();
		body.set('taskId', taskId);
		body.set('encouragement', encouragement);
		// Fire-and-forget — tile already shows completed state locally
		fetch('?/complete', { method: 'POST', body });
	}
</script>

<TaskGrid
	tasks={data.tasks}
	completedToday={data.completedToday}
	themeId={data.profile?.active_theme_id ?? 'friendly'}
	onTaskComplete={handleTaskComplete}
/>

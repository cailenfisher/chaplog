<script lang="ts">
	import { page } from '$app/state';
	import { TASKS, VIP_PROFILE } from '$lib/tasks';
	import TaskGrid from '$lib/components/TaskGrid.svelte';

	const themeId = $derived(page.url.searchParams.get('theme') ?? VIP_PROFILE.activeThemeId);
</script>

<TaskGrid tasks={TASKS} {themeId} />

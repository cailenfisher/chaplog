<script lang="ts">
	import { page } from '$app/state';
	import { VIP_PROFILE } from '$lib/tasks';
	import TaskGrid from '$lib/components/TaskGrid.svelte';

	// ?theme=lcars in the URL overrides the profile default (useful for demos / dev)
	const themeId = $derived(page.url.searchParams.get('theme') ?? VIP_PROFILE.activeThemeId);
</script>

<TaskGrid {themeId} />

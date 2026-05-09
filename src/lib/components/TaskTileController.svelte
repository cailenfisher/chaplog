<script lang="ts">
	import type { Task } from '$lib/tasks';
	import type { ThemeConfig, TileState } from '$lib/themes/types';

	interface Props {
		task: Task;
		theme: ThemeConfig;
		onComplete?: (taskId: string) => void;
	}

	let { task, theme, onComplete }: Props = $props();

	// Grid placement — same rules for all themes (4-col × 3-row grid)
	const colClass = $derived(task.importance >= 2 ? 'col-span-2' : 'col-span-1');
	const rowClass = $derived(task.importance === 3 ? 'row-span-2' : 'row-span-1');

	// Tile state machine — named tileState to avoid conflict with the $state rune
	let tileState: TileState = $state('pending');
	let encouragement = $state('');

	function ontap() {
		if (tileState !== 'pending') return;
		tileState = 'confirming';
	}

	function onconfirm() {
		const msgs = task.encouragements;
		encouragement = msgs[Math.floor(Math.random() * msgs.length)];
		tileState = 'completed';
		onComplete?.(task.id);
	}

	function oncancel() {
		tileState = 'pending';
	}

	const Tile = $derived(theme.Tile);
</script>

<!-- Grid cell sizing wrapper — themes fill this div -->
<div class="{colClass} {rowClass} min-w-0 min-h-0">
	<Tile {task} state={tileState} {encouragement} {ontap} {onconfirm} {oncancel} />
</div>

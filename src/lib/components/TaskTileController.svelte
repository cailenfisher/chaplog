<script lang="ts">
	import { untrack } from 'svelte';
	import type { Task } from '$lib/tasks';
	import type { ThemeConfig, TileState } from '$lib/themes/types';

	interface Props {
		task: Task;
		theme: ThemeConfig;
		initialCompleted?: boolean;
		initialEncouragement?: string;
		onComplete?: (taskId: string, encouragement: string) => void;
	}

	let {
		task,
		theme,
		initialCompleted = false,
		initialEncouragement = '',
		onComplete
	}: Props = $props();

	// Grid placement — same rules for all themes (4-col × 3-row grid)
	const colClass = $derived(task.importance >= 2 ? 'col-span-2' : 'col-span-1');
	const rowClass = $derived(task.importance === 3 ? 'row-span-2' : 'row-span-1');

	// Tile state machine — named tileState to avoid conflict with the $state rune
	let tileState: TileState = $state(untrack(() => (initialCompleted ? 'completed' : 'pending')));
	let encouragement = $state(untrack(() => initialEncouragement));

	function ontap() {
		if (tileState !== 'pending') return;
		tileState = 'confirming';
	}

	function onconfirm() {
		const msgs = task.encouragements;
		const enc =
			msgs.length > 0 ? msgs[Math.floor(Math.random() * msgs.length)] : 'Great job! ✓';
		encouragement = enc;
		tileState = 'completed';
		onComplete?.(task.id, enc);
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

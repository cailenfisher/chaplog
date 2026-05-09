<script lang="ts">
	import type { TileProps } from '$lib/themes/types';

	let { task, state, encouragement, ontap, onconfirm, oncancel }: TileProps = $props();

	// LCARS color palette — one solid color per task, no gradients
	const TASK_COLORS: Record<string, { panel: string; text: string; accent: string }> = {
		'morning-meds': { panel: '#FF9900', text: '#000000', accent: '#CC6600' },
		'evening-meds':  { panel: '#CC66CC', text: '#000000', accent: '#993399' },
		'eat-dinner':    { panel: '#CC3300', text: '#FFFFFF', accent: '#991100' },
		'wash-hands':    { panel: '#5588DD', text: '#FFFFFF', accent: '#2255AA' },
		'get-sunlight':  { panel: '#FFCC00', text: '#000000', accent: '#CC9900' }
	};
	const DEFAULT_COLOR = { panel: '#FF9900', text: '#000000', accent: '#CC6600' };
	const color = $derived(TASK_COLORS[task.id] ?? DEFAULT_COLOR);

	// LCARS system code derived deterministically from task id
	const taskCode = $derived((() => {
		const letters = task.id.split('-').map((w) => w[0].toUpperCase()).join('');
		const num = task.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9000 + 1000;
		return `${letters}-${num}`;
	})());

	// Font sizes scaled to tile importance (matches friendly theme sizing logic)
	const iconSize = $derived(
		task.importance === 3
			? 'clamp(2.5rem, 5vw, 4.5rem)'
			: task.importance === 2
				? 'clamp(1.8rem, 3.5vw, 3rem)'
				: 'clamp(1.4rem, 2.8vw, 2.2rem)'
	);
	const nameSize = $derived(
		task.importance === 3
			? 'clamp(1.2rem, 2.5vw, 2rem)'
			: task.importance === 2
				? 'clamp(1rem, 2vw, 1.6rem)'
				: 'clamp(0.7rem, 1.4vw, 1.1rem)'
	);
	const codeSize = $derived(task.importance === 1 ? '0.55rem' : '0.65rem');
</script>

<!--
  LCARS tile: solid color panel, black text/accents, uppercase tracking typography.
  State transitions use opacity + scale instead of 3D flip (LCARS is flat).
-->
<div
	class="lcars-tile w-full h-full rounded-2xl overflow-hidden select-none relative"
	style="background: {color.panel};"
>
	<!-- System code badge — top right corner -->
	<div
		class="lcars-text absolute top-2 right-2.5 font-bold tracking-[0.15em] opacity-40"
		style="font-size: {codeSize}; color: {color.text};"
	>
		{taskCode}
	</div>

	<!-- ── PENDING ──────────────────────────────────────────────────────────── -->
	{#if state === 'pending'}
		<button
			onclick={ontap}
			class="w-full h-full flex flex-col items-center justify-center gap-2 px-3
			       transition-all duration-100 active:brightness-75"
			style="touch-action: manipulation;"
		>
			<!-- Icon -->
			<span class="leading-none" style="font-size: {iconSize};">{task.icon}</span>

			<!-- Task name -->
			<span
				class="lcars-text font-bold text-center leading-tight tracking-[0.15em] uppercase"
				style="font-size: {nameSize}; color: {color.text};"
			>
				{task.name}
			</span>

			<!-- Decorative bottom bar (LCARS accent line) -->
			<div
				class="absolute bottom-0 left-0 right-0 flex gap-1 p-1.5"
			>
				<div class="h-2 flex-1 rounded-full opacity-50" style="background: {color.accent};"></div>
				<div class="h-2 w-6 rounded-full opacity-30" style="background: {color.accent};"></div>
			</div>
		</button>

	<!-- ── CONFIRMING ───────────────────────────────────────────────────────── -->
	{:else if state === 'confirming'}
		<div class="w-full h-full flex flex-col justify-between p-3 bg-black/90">
			<!-- Header -->
			<div>
				<p
					class="lcars-text tracking-[0.2em] uppercase font-bold"
					style="font-size: clamp(0.6rem, 1.1vw, 0.85rem); color: {color.panel};"
				>
					Confirm Task
				</p>
				<p
					class="lcars-text font-bold tracking-[0.1em] uppercase leading-tight mt-1"
					style="font-size: clamp(0.85rem, 1.8vw, 1.4rem); color: {color.panel};"
				>
					{task.name}
				</p>
			</div>

			<!-- LCARS-style confirm / abort buttons -->
			<div class="flex flex-col gap-2">
				<button
					onclick={onconfirm}
					class="lcars-text w-full rounded-full font-bold tracking-[0.2em] uppercase
					       transition-all duration-100 active:scale-95"
					style="padding: clamp(0.5rem, 1.5vh, 0.9rem);
					       font-size: clamp(0.75rem, 1.6vw, 1.1rem);
					       background: #33CC66; color: #000;"
				>
					CONFIRMED ✓
				</button>
				<button
					onclick={oncancel}
					class="lcars-text w-full rounded-full font-bold tracking-[0.2em] uppercase
					       transition-all duration-100 active:scale-95"
					style="padding: clamp(0.35rem, 1vh, 0.65rem);
					       font-size: clamp(0.65rem, 1.3vw, 0.9rem);
					       background: {color.panel}; color: {color.text};"
				>
					ABORT
				</button>
			</div>
		</div>

	<!-- ── COMPLETED ────────────────────────────────────────────────────────── -->
	{:else}
		<div
			class="w-full h-full flex flex-col items-center justify-center gap-2 p-3"
			style="background: #0a1a0a;"
		>
			<!-- COMPLETE status bar -->
			<div class="w-full flex items-center gap-1.5 mb-1">
				<div class="h-2 flex-1 rounded-full bg-[#33CC66]"></div>
				<span
					class="lcars-text font-bold tracking-[0.2em] uppercase text-[#33CC66]"
					style="font-size: clamp(0.55rem, 1vw, 0.75rem);"
				>
					COMPLETE
				</span>
				<div class="h-2 w-4 rounded-full bg-[#33CC66]/40"></div>
			</div>

			<!-- Encouragement text -->
			<p
				class="lcars-text font-bold text-center leading-snug tracking-[0.08em] uppercase text-[#33CC66]"
				style="font-size: clamp(0.7rem, 1.5vw, 1.1rem);"
			>
				{encouragement}
			</p>

			<!-- Task logged indicator -->
			<p
				class="lcars-text tracking-[0.15em] uppercase text-[#33CC66]/50"
				style="font-size: clamp(0.5rem, 0.9vw, 0.65rem);"
			>
				TASK LOGGED
			</p>
		</div>
	{/if}
</div>

<style>
	.lcars-text {
		font-family: 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif;
	}

	.lcars-tile {
		transition: filter 0.15s ease;
	}
</style>

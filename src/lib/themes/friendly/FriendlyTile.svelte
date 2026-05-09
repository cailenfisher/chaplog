<script lang="ts">
	import type { TileProps } from '$lib/themes/types';
	import { fade } from 'svelte/transition';

	let { task, state, encouragement, ontap, onconfirm, oncancel }: TileProps = $props();

	const iconSize = $derived(
		task.importance === 3
			? 'clamp(3.5rem, 7vw, 6rem)'
			: task.importance === 2
				? 'clamp(2.5rem, 5vw, 4.5rem)'
				: 'clamp(2rem, 4vw, 3.2rem)'
	);
	const nameSize = $derived(
		task.importance === 3
			? 'clamp(1.6rem, 3.2vw, 2.8rem)'
			: task.importance === 2
				? 'clamp(1.3rem, 2.4vw, 2rem)'
				: 'clamp(1rem, 1.8vw, 1.5rem)'
	);
	const confirmSize = $derived(
		task.importance === 3 ? 'clamp(1.4rem, 3vw, 2.5rem)' : 'clamp(1.1rem, 2.5vw, 2rem)'
	);
</script>

<!-- Perspective wrapper fills the controller's grid cell -->
<div class="w-full h-full" style="perspective: 1200px;">
	<div class="flip-inner relative w-full h-full" class:flipped={state === 'completed'}>
		<!-- ── FRONT FACE ─────────────────────────────────────── -->
		<div
			class="flip-face absolute inset-0 rounded-2xl overflow-hidden shadow-lg"
			style="background: linear-gradient(145deg, {task.gradient[0]}, {task.gradient[1]});"
		>
			{#if state === 'confirming'}
				<div
					class="absolute inset-0 flex flex-col items-center justify-center gap-5 p-5 bg-black/85"
					transition:fade={{ duration: 150 }}
				>
					<p
						class="text-white font-bold text-center leading-snug"
						style="font-size: {confirmSize};"
					>
						Did you<br /><span class="text-yellow-300">{task.name}</span>?
					</p>
					<div class="flex flex-col gap-3 w-full" style="max-width: min(22rem, 85%);">
						<button
							onclick={onconfirm}
							class="w-full rounded-2xl bg-emerald-500 text-white font-bold leading-none
							       transition-transform active:scale-95 select-none shadow-lg"
							style="padding: clamp(0.8rem, 2vh, 1.4rem); font-size: clamp(1.4rem, 3vw, 2.2rem);"
						>
							✓ &nbsp;Yes, I did!
						</button>
						<button
							onclick={oncancel}
							class="w-full rounded-2xl bg-white/20 text-white font-semibold
							       transition-transform active:scale-95 select-none"
							style="padding: clamp(0.5rem, 1.5vh, 1rem); font-size: clamp(1rem, 2vw, 1.5rem);"
						>
							Not yet
						</button>
					</div>
				</div>
			{:else}
				<button
					onclick={ontap}
					class="w-full h-full flex flex-col items-center justify-center gap-3
					       select-none transition-transform active:scale-[0.97]"
				>
					<span class="leading-none drop-shadow" style="font-size: {iconSize};">
						{task.icon}
					</span>
					<span
						class="text-white font-bold text-center px-4 leading-tight drop-shadow"
						style="font-size: {nameSize};"
					>
						{task.name}
					</span>
					{#if task.importance === 3}
						<span class="text-white/50 font-medium" style="font-size: clamp(0.8rem, 1.2vw, 1rem);">
							Tap to complete
						</span>
					{/if}
				</button>
			{/if}
		</div>

		<!-- ── BACK FACE (completed) ──────────────────────────── -->
		<div
			class="flip-back absolute inset-0 rounded-2xl overflow-hidden shadow-lg
			       flex flex-col items-center justify-center gap-4 p-6"
			style="background: linear-gradient(145deg, #064e3b, #065f46);"
		>
			<span class="leading-none" style="font-size: {iconSize};">✅</span>
			<p
				class="text-emerald-100 font-bold text-center leading-snug"
				style="font-size: {nameSize};"
			>
				{encouragement}
			</p>
			<span class="text-emerald-400/60 font-medium" style="font-size: clamp(0.75rem, 1.2vw, 1rem);">
				Done for today!
			</span>
		</div>
	</div>
</div>

<style>
	.flip-inner {
		transform-style: preserve-3d;
		transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.flip-inner.flipped {
		transform: rotateY(180deg);
	}
	.flip-face,
	.flip-back {
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}
	.flip-back {
		transform: rotateY(180deg);
	}
</style>

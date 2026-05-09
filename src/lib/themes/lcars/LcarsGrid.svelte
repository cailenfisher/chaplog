<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Simulate a stardate from the real date
	const now = new Date();
	const stardate = (
		47000 +
		(now.getFullYear() - 1994) * 1000 +
		Math.floor(((now.getMonth() * 30 + now.getDate()) / 365) * 1000)
	).toFixed(1);
</script>

<!--
  LCARS layout: black bg, amber header bar with elbow, then the task grid.
  Colors: amber #FF9900, gold #FFCC00, purple #CC66CC, blue #5588DD, red-orange #CC3300
-->
<div class="fixed inset-0 overflow-hidden bg-black flex flex-col" style="overscroll-behavior: none;">
	<!-- ── LCARS Header ──────────────────────────────────────────────────────── -->
	<div class="flex items-stretch shrink-0 gap-0 px-2 pt-2 pb-0" style="height: 3.5rem;">
		<!-- Left elbow: tall pill + horizontal arm -->
		<div class="flex items-stretch shrink-0">
			<!-- Tall vertical pill -->
			<div class="w-10 bg-[#FF9900] rounded-l-full rounded-r-none"></div>
			<!-- Corner connector block — fills between pill and horizontal arm -->
			<div class="flex flex-col justify-between w-5">
				<!-- Top arm extending right from top of pill -->
				<div class="h-5 bg-[#FF9900] rounded-tr-xl"></div>
				<!-- Gap (black shows through = the elbow cutout) -->
				<div class="h-4 bg-transparent"></div>
			</div>
			<!-- Horizontal bar stack -->
			<div class="flex flex-col justify-start gap-1 pt-0">
				<div class="h-5 w-28 bg-[#FF9900] rounded-r-full"></div>
				<div class="h-3 w-20 bg-[#CC6600] rounded-r-full"></div>
			</div>
		</div>

		<!-- Title area — aligns to bottom of header -->
		<div class="flex-1 flex items-end gap-4 px-4 pb-1.5">
			<span class="lcars-text text-[#FF9900] font-bold tracking-[0.3em] text-sm">CHAPLOG</span>
			<span class="lcars-text text-[#FF9900]/40 tracking-[0.25em] text-xs">DAILY TASK INTERFACE</span>
		</div>

		<!-- Right decorative bars + stardate -->
		<div class="flex items-end gap-2 pb-1.5 pr-1 shrink-0">
			<span class="lcars-text text-[#FF9900]/50 tracking-[0.2em] text-xs">SD&nbsp;{stardate}</span>
			<div class="h-5 w-16 bg-[#FFCC00] rounded-full"></div>
			<div class="h-5 w-10 bg-[#CC66CC] rounded-full"></div>
			<div class="h-5 w-6 bg-[#5588DD] rounded-full"></div>
		</div>
	</div>

	<!-- Thin separator line in amber -->
	<div class="h-px bg-[#FF9900]/25 mx-2 mt-1 shrink-0"></div>

	<!-- ── Task grid ─────────────────────────────────────────────────────────── -->
	<div class="flex-1 grid grid-cols-4 grid-rows-3 gap-1.5 p-2">
		{@render children()}
	</div>

	<!-- ── LCARS footer bar ──────────────────────────────────────────────────── -->
	<div class="flex items-stretch shrink-0 gap-2 px-2 pb-2 pt-1" style="height: 2.25rem;">
		<div class="h-full w-10 bg-[#FF9900] rounded-full"></div>
		<div class="h-full w-32 bg-[#CC6600] rounded-full"></div>
		<div class="flex-1 h-full bg-[#FF9900]/15 rounded-full"></div>
		<div class="h-full w-20 bg-[#FFCC00] rounded-full"></div>
		<div class="h-full w-10 bg-[#CC66CC] rounded-full"></div>
	</div>
</div>

<style>
	.lcars-text {
		font-family: 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif;
	}
</style>

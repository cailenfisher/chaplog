<script lang="ts">
	// Stardate matching the grid header
	const now = new Date();
	const stardate = (
		47000 +
		(now.getFullYear() - 1994) * 1000 +
		Math.floor(((now.getMonth() * 30 + now.getDate()) / 365) * 1000)
	).toFixed(1);
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
	<!-- Top decorative LCARS bar -->
	<div class="absolute top-0 left-0 right-0 flex gap-2 p-3">
		<div class="h-6 w-14 bg-[#FF9900] rounded-full"></div>
		<div class="h-6 flex-1 bg-[#CC6600] rounded-full"></div>
		<div class="h-6 w-10 bg-[#FFCC00] rounded-full"></div>
		<div class="h-6 w-8 bg-[#CC66CC] rounded-full"></div>
	</div>

	<!-- Main content -->
	<div class="flex flex-col items-center gap-6 px-8 text-center select-none">
		<!-- Status label -->
		<div class="flex items-center gap-3 w-full">
			<div class="h-1 flex-1 bg-[#33CC66] rounded-full"></div>
			<span
				class="lcars-text font-bold tracking-[0.35em] uppercase text-[#33CC66]"
				style="font-size: clamp(0.65rem, 1.2vw, 0.9rem);"
			>
				SYSTEM STATUS : NOMINAL
			</span>
			<div class="h-1 flex-1 bg-[#33CC66] rounded-full"></div>
		</div>

		<!-- Main heading -->
		<h1
			class="lcars-text font-bold tracking-[0.25em] uppercase text-[#FF9900] leading-tight"
			style="font-size: clamp(2rem, 5vw, 4rem);"
		>
			ALL TASKS<br />COMPLETE
		</h1>

		<!-- Decorative bars (LCARS style data readout) -->
		<div class="flex gap-2 w-full max-w-lg">
			<div class="h-4 flex-[3] bg-[#33CC66] rounded-full"></div>
			<div class="h-4 flex-[1] bg-[#33CC66]/40 rounded-full"></div>
			<div class="h-4 flex-[2] bg-[#33CC66]/70 rounded-full"></div>
		</div>

		<!-- Stardate + task count -->
		<div class="flex flex-col items-center gap-1">
			<p
				class="lcars-text tracking-[0.3em] uppercase text-[#FF9900]/60"
				style="font-size: clamp(0.75rem, 1.5vw, 1rem);"
			>
				STARDATE {stardate}
			</p>
			<p
				class="lcars-text tracking-[0.2em] uppercase text-[#FF9900]/40"
				style="font-size: clamp(0.6rem, 1.1vw, 0.8rem);"
			>
				DAILY TASK SEQUENCE COMPLETE
			</p>
		</div>

		<!-- Decorative separator -->
		<div class="flex gap-2 w-full max-w-lg">
			<div class="h-2 w-8 bg-[#FF9900] rounded-full"></div>
			<div class="h-2 flex-1 bg-[#FF9900]/20 rounded-full"></div>
			<div class="h-2 w-12 bg-[#FFCC00] rounded-full"></div>
			<div class="h-2 w-6 bg-[#CC66CC] rounded-full"></div>
		</div>
	</div>

	<!-- Bottom decorative LCARS bar -->
	<div class="absolute bottom-0 left-0 right-0 flex gap-2 p-3">
		<div class="h-6 w-8 bg-[#CC66CC] rounded-full"></div>
		<div class="h-6 w-10 bg-[#FFCC00] rounded-full"></div>
		<div class="h-6 flex-1 bg-[#CC6600] rounded-full"></div>
		<div class="h-6 w-14 bg-[#FF9900] rounded-full"></div>
	</div>
</div>

<style>
	.lcars-text {
		font-family: 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif;
	}
</style>

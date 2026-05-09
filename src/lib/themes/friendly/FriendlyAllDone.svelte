<script lang="ts">
	import { fade } from 'svelte/transition';
</script>

<div
	class="fixed inset-0 z-50 flex flex-col items-center justify-center
	       bg-black/75 backdrop-blur-sm"
	transition:fade={{ duration: 400 }}
>
	<div class="text-center px-8 select-none">
		<div class="animate-bounce" style="font-size: clamp(6rem, 15vw, 12rem);">🎉</div>
		<h1 class="text-white font-bold mt-6 leading-tight" style="font-size: clamp(2.5rem, 6vw, 5rem);">
			All done for today!
		</h1>
		<p class="text-white/70 mt-3" style="font-size: clamp(1.4rem, 3vw, 2.5rem);">
			You did an absolutely amazing job! 🌟
		</p>
	</div>
</div>

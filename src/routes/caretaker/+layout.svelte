<script lang="ts">
	let { children } = $props();

	const today = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Top bar -->
	<header class="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<div class="flex items-center gap-3">
				<span class="text-2xl">🏥</span>
				<div>
					<p class="text-xs font-medium uppercase tracking-widest text-slate-400">ChapLog</p>
					<p class="text-sm font-semibold text-slate-700">Caretaker Portal</p>
				</div>
			</div>
			<p class="hidden text-sm text-slate-400 sm:block">{today}</p>
		</div>
	</header>

	<!-- Page content -->
	<main class="mx-auto max-w-5xl px-6 py-8">
		{@render children()}
	</main>
</div>

<script lang="ts">
	import { THEMES } from '$lib/themes/registry';
	import { resolve } from '$app/paths';

	const themeOptions = Object.values(THEMES);
	let selectedTheme = $state('friendly');
</script>

<svelte:head>
	<title>ChapLog Demo</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
	<!-- Header -->
	<div class="mb-12 text-center">
		<span class="text-5xl">🏥</span>
		<h1 class="mt-4 text-4xl font-bold text-slate-800">ChapLog</h1>
		<p class="mt-2 text-lg text-slate-500">Interactive preview — no login required.</p>
	</div>

	<!-- Cards -->
	<div class="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
		<!-- Caretaker card -->
		<div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Portal</p>
				<h2 class="mt-1 text-xl font-bold text-slate-800">Caretaker Dashboard</h2>
				<p class="mt-2 text-sm text-slate-500">
					View patient progress, manage tasks, and browse completion reports.
				</p>
			</div>
			<a
				href={resolve('/demo/chaplog/caretaker')}
				class="mt-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5
				       text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]"
			>
				Open dashboard →
			</a>
		</div>

		<!-- VIP card -->
		<div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-slate-400">VIP View</p>
				<h2 class="mt-1 text-xl font-bold text-slate-800">Task Tile View</h2>
				<p class="mt-2 text-sm text-slate-500">
					The full-screen tablet experience a VIP uses to log their daily tasks.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-slate-500">Choose theme</span>
					<select
						bind:value={selectedTheme}
						class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700
						       outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
					>
						{#each themeOptions as theme (theme.id)}
							<option value={theme.id}>{theme.name}</option>
						{/each}
					</select>
				</label>

				<a
					href={resolve(`/demo/chaplog/vip?theme=${selectedTheme}`)}
					class="inline-flex items-center justify-center rounded-xl bg-slate-800 px-5 py-2.5
					       text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-[0.98]"
				>
					Launch VIP view →
				</a>
			</div>
		</div>
	</div>

	<p class="mt-10 text-sm text-slate-400">
		<a href={resolve('/auth/login')} class="underline hover:text-slate-600">Sign in</a> to access the real system.
	</p>
</div>

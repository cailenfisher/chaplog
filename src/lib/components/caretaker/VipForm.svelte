<script lang="ts">
	import { untrack } from 'svelte';
	import { store } from '$lib/caretaker-store.svelte';
	import { THEMES } from '$lib/themes/registry';
	import type { VipSummary } from '$lib/mock-caretaker';

	interface Props {
		vip?: VipSummary;
		onclose: () => void;
	}

	let { vip, onclose }: Props = $props();

	const isEdit = $derived(!!vip);
	const themeOptions = Object.values(THEMES).map((t) => ({ id: t.id, name: t.name }));

	let name = $state(untrack(() => vip?.display_name ?? ''));
	let themeId = $state(untrack(() => vip?.activeThemeId ?? 'friendly'));

	let dialog: HTMLDialogElement;

	$effect(() => {
		dialog.showModal();
	});

	function save() {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (isEdit && vip) {
			store.updateVip(vip.id, { display_name: trimmed, activeThemeId: themeId });
		} else {
			store.addVip({ display_name: trimmed, activeThemeId: themeId });
		}
		onclose();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={onclose}
	onkeydown={onkeydown}
	class="w-full max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
>
	<form onsubmit={save} class="flex flex-col gap-6 p-6">
		<h2 class="text-xl font-bold text-slate-800">
			{isEdit ? 'Edit Patient' : 'Add Patient'}
		</h2>

		<div class="flex flex-col gap-4">
			<label class="flex flex-col gap-1.5">
				<span class="text-sm font-medium text-slate-700">Name</span>
				<input
					type="text"
					bind:value={name}
					placeholder="Display name"
					required
					class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800
					       outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
				/>
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="text-sm font-medium text-slate-700">Interface theme</span>
				<select
					bind:value={themeId}
					class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800
					       outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
				>
					{#each themeOptions as opt}
						<option value={opt.id}>{opt.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={onclose}
				class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium
				       text-slate-600 hover:bg-slate-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={!name.trim()}
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
				       hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
			>
				{isEdit ? 'Save changes' : 'Add patient'}
			</button>
		</div>
	</form>
</dialog>

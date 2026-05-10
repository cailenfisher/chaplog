<script lang="ts">
	import { untrack } from 'svelte';
	import type { ReportTask } from '$lib/mock-caretaker';

	interface Props {
		task?: ReportTask;
		onSave: (data: { name: string; icon: string; importance: 1 | 2 | 3 }) => void | Promise<void>;
		onclose: () => void;
	}

	let { task, onSave, onclose }: Props = $props();

	const isEdit = $derived(!!task);

	let name = $state(untrack(() => task?.name ?? ''));
	let icon = $state(untrack(() => task?.icon ?? ''));
	let importance = $state<1 | 2 | 3>(untrack(() => task?.importance ?? 1));

	let dialog: HTMLDialogElement;

	$effect(() => {
		dialog.showModal();
	});

	async function save() {
		const trimmedName = name.trim();
		const trimmedIcon = icon.trim();
		if (!trimmedName || !trimmedIcon) return;
		await onSave({ name: trimmedName, icon: trimmedIcon, importance });
		onclose();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	const importanceOptions: { value: 1 | 2 | 3; label: string; description: string }[] = [
		{ value: 1, label: 'Small', description: '1×1 tile' },
		{ value: 2, label: 'Wide', description: '2×1 tile' },
		{ value: 3, label: 'Large', description: '2×2 tile' }
	];
</script>

<dialog
	bind:this={dialog}
	onclose={onclose}
	onkeydown={onkeydown}
	class="w-full max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
>
	<form onsubmit={save} class="flex flex-col gap-6 p-6">
		<h2 class="text-xl font-bold text-slate-800">{isEdit ? 'Edit Task' : 'Add Task'}</h2>

		<div class="flex flex-col gap-4">
			<div class="flex gap-3">
				<label class="flex flex-col gap-1.5" style="width:5rem">
					<span class="text-sm font-medium text-slate-700">Icon</span>
					<input
						type="text"
						bind:value={icon}
						placeholder="💊"
						required
						maxlength="2"
						class="rounded-lg border border-slate-200 px-3 py-2 text-center text-xl
						       outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
					/>
				</label>

				<label class="flex flex-1 flex-col gap-1.5">
					<span class="text-sm font-medium text-slate-700">Task name</span>
					<input
						type="text"
						bind:value={name}
						placeholder="e.g. Morning Meds"
						required
						class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800
						       outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
					/>
				</label>
			</div>

			<fieldset class="flex flex-col gap-2">
				<legend class="text-sm font-medium text-slate-700">Tile size</legend>
				<div class="flex gap-2">
					{#each importanceOptions as opt (opt.value)}
						<label
							class="flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-lg border
							       px-3 py-2.5 text-center transition-all
							       {importance === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}"
						>
							<input type="radio" name="importance" value={opt.value} bind:group={importance} class="sr-only" />
							<span class="text-sm font-semibold text-slate-800">{opt.label}</span>
							<span class="text-xs text-slate-400">{opt.description}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		</div>

		<div class="flex justify-end gap-3">
			<button type="button" onclick={onclose} class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
				Cancel
			</button>
			<button
				type="submit"
				disabled={!name.trim() || !icon.trim()}
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
				       hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
			>
				{isEdit ? 'Save changes' : 'Add task'}
			</button>
		</div>
	</form>
</dialog>

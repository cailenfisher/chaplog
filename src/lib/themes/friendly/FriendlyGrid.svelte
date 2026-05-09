<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div
	class="fixed inset-0 overflow-hidden bg-slate-900
	       grid grid-cols-4 grid-rows-3 gap-2 p-2"
	style="overscroll-behavior: none;"
>
	{@render children()}
</div>

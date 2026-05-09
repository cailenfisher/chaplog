import type { Task } from '$lib/tasks';
import type { Component, Snippet } from 'svelte';

export type TileState = 'pending' | 'confirming' | 'completed';

export interface TileProps {
	task: Task;
	state: TileState;
	encouragement: string;
	ontap: () => void;
	onconfirm: () => void;
	oncancel: () => void;
}

export interface GridProps {
	children: Snippet;
}

export interface ThemeConfig {
	id: string;
	name: string;
	Tile: Component<TileProps>;
	Grid: Component<GridProps>;
	AllDone: Component;
}

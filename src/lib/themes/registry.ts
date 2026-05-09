import type { ThemeConfig } from './types';
import FriendlyGrid from './friendly/FriendlyGrid.svelte';
import FriendlyTile from './friendly/FriendlyTile.svelte';
import FriendlyAllDone from './friendly/FriendlyAllDone.svelte';
import LcarsGrid from './lcars/LcarsGrid.svelte';
import LcarsTile from './lcars/LcarsTile.svelte';
import LcarsAllDone from './lcars/LcarsAllDone.svelte';

export const THEMES: Record<string, ThemeConfig> = {
	friendly: {
		id: 'friendly',
		name: 'Friendly',
		Grid: FriendlyGrid,
		Tile: FriendlyTile,
		AllDone: FriendlyAllDone
	},
	lcars: {
		id: 'lcars',
		name: 'LCARS',
		Grid: LcarsGrid,
		Tile: LcarsTile,
		AllDone: LcarsAllDone
	}
};

<script module>
	let _uid = 0;
</script>

<script lang="ts">
	import type { ReportTask, Completion } from '$lib/mock-caretaker';
	import { addDays, toDateStr } from '$lib/mock-caretaker';

	interface Props {
		tasks: ReportTask[];
		completions: Completion[];
	}

	let { tasks, completions }: Props = $props();

	const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316'];

	// SVG layout constants
	const VW = 560, VH = 140;
	const PT = 14, PB = 28, PL = 28, PR = 8;
	const CW = VW - PL - PR;
	const CH = VH - PT - PB;
	const WINDOW = 7;
	const DAYS = 30;
	const POINTS = DAYS - WINDOW + 1; // 24

	// Unique ID to avoid gradient ID collisions between multiple chart instances
	const uid = ++_uid;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	// Oldest → newest, 30 entries
	const dates = Array.from({ length: DAYS }, (_, i) =>
		toDateStr(addDays(today, -(DAYS - 1 - i)))
	);

	const completedByTask = $derived(
		(() => {
			const m = new Map<string, Set<string>>();
			for (const task of tasks) m.set(task.id, new Set<string>());
			for (const c of completions) m.get(c.task_id)?.add(c.completion_date);
			return m;
		})()
	);

	const series = $derived(
		tasks.map((task, ti) => {
			const doneSet = completedByTask.get(task.id) ?? new Set<string>();
			const rates = Array.from({ length: POINTS }, (_, i) => {
				let count = 0;
				for (let j = i; j < i + WINDOW; j++) if (doneSet.has(dates[j])) count++;
				return count / WINDOW;
			});
			return { task, color: COLORS[ti % COLORS.length], rates };
		})
	);

	function px(i: number) {
		return PL + (i / (POINTS - 1)) * CW;
	}
	function py(r: number) {
		return PT + (1 - r) * CH;
	}

	function smoothPath(rates: number[]): string {
		const pts = rates.map((r, i) => [px(i), py(r)] as [number, number]);
		let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
		for (let i = 1; i < pts.length; i++) {
			const mx = ((pts[i - 1][0] + pts[i][0]) / 2).toFixed(1);
			d += ` C ${mx},${pts[i - 1][1].toFixed(1)} ${mx},${pts[i][1].toFixed(1)} ${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
		}
		return d;
	}

	function areaPath(rates: number[]): string {
		const base = (PT + CH).toFixed(1);
		return `${smoothPath(rates)} L ${px(rates.length - 1).toFixed(1)},${base} L ${px(0).toFixed(1)},${base} Z`;
	}

	// Month boundary labels along X axis
	const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	const monthLabels = $derived(
		(() => {
			const result: { x: number; label: string }[] = [];
			for (let i = 0; i < POINTS; i++) {
				const mo = Number(dates[i].split('-')[1]);
				const prevMo = i > 0 ? Number(dates[i - 1].split('-')[1]) : -1;
				if (mo !== prevMo) result.push({ x: px(i), label: MONTH_ABBR[mo - 1] });
			}
			return result;
		})()
	);

	const gridRates = [0, 0.25, 0.5, 0.75, 1.0];
</script>

<div>
	<svg
		viewBox="0 0 {VW} {VH}"
		class="w-full"
		aria-label="Task completion rate over past 30 days"
	>
		<defs>
			{#each series as s, i}
				<linearGradient
					id="area-{uid}-{i}"
					gradientUnits="userSpaceOnUse"
					x1="0" y1={PT}
					x2="0" y2={PT + CH}
				>
					<stop offset="0%" stop-color={s.color} stop-opacity="0.20" />
					<stop offset="100%" stop-color={s.color} stop-opacity="0.02" />
				</linearGradient>
			{/each}
		</defs>

		<!-- Grid lines + Y labels -->
		{#each gridRates as rate}
			{@const gy = py(rate)}
			<line x1={PL} y1={gy} x2={VW - PR} y2={gy} stroke="#e2e8f0" stroke-width="1" />
			<text
				x={PL - 4}
				y={gy}
				text-anchor="end"
				dominant-baseline="middle"
				font-size="8"
				fill="#94a3b8"
			>{rate === 0 ? '' : rate === 1 ? '100%' : `${rate * 100 | 0}%`}</text>
		{/each}

		<!-- Area fills -->
		{#each series as s, i}
			<path d={areaPath(s.rates)} fill="url(#area-{uid}-{i})" />
		{/each}

		<!-- Lines -->
		{#each series as s}
			<path
				d={smoothPath(s.rates)}
				fill="none"
				stroke={s.color}
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/each}

		<!-- Endpoint dots (most recent value) -->
		{#each series as s}
			{@const last = s.rates[s.rates.length - 1]}
			<circle cx={px(POINTS - 1)} cy={py(last)} r="3.5" fill={s.color} />
		{/each}

		<!-- X axis month labels -->
		{#each monthLabels as { x, label }}
			<text x={x} y={VH - 6} text-anchor="middle" font-size="8" fill="#94a3b8">{label}</text>
		{/each}
	</svg>

	<!-- Legend -->
	<div class="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
		{#each series as s}
			{@const recentPct = Math.round(s.rates[s.rates.length - 1] * 100)}
			<div class="flex items-center gap-1.5 text-xs text-slate-600">
				<div class="h-0.5 w-5 rounded-full" style="background:{s.color}"></div>
				<span>{s.task.icon}</span>
				<span>{s.task.name}</span>
				<span class="font-semibold" style="color:{s.color}">{recentPct}%</span>
			</div>
		{/each}
	</div>
</div>

// =============================================================================
// Mock data for the caretaker dashboard and VIP report screens.
// Replace with real Supabase queries when auth is wired up.
// =============================================================================

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportTask {
	id: string;
	name: string;
	icon: string;
	importance: 1 | 2 | 3;
	deletedAt?: string;
}

export interface Completion {
	id: string;
	task_id: string;
	completion_date: string; // YYYY-MM-DD (local date)
	completed_at: string; // ISO 8601
	encouragement_shown: string | null;
	notes: string | null;
}

export interface VipSummary {
	id: string;
	display_name: string;
	activeThemeId: string;
	tasks: ReportTask[];
	completions: Completion[];
}

// ── Date utilities ────────────────────────────────────────────────────────────

/** YYYY-MM-DD using local calendar (not UTC). */
export function toDateStr(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function addDays(date: Date, n: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + n);
	return d;
}

/** Monday of the week that contains `date`. */
export function weekStart(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	const day = d.getDay(); // 0 = Sun
	d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
	return d;
}

/**
 * Calendar grid for a given month — rows are weeks (Mon–Sun).
 * `null` cells are padding days outside the month.
 */
export function monthCalendar(year: number, month: number): (Date | null)[][] {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startPad = (firstDay.getDay() + 6) % 7; // Mon = 0
	const days: (Date | null)[] = [
		...Array<null>(startPad).fill(null),
		...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1))
	];
	const weeks: (Date | null)[][] = [];
	for (let i = 0; i < days.length; i += 7) {
		const week = days.slice(i, i + 7);
		while (week.length < 7) week.push(null);
		weeks.push(week);
	}
	return weeks;
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export function completionsForDate(completions: Completion[], dateStr: string): Completion[] {
	return completions.filter((c) => c.completion_date === dateStr);
}

export function completionsForRange(completions: Completion[], from: string, to: string): Completion[] {
	return completions.filter((c) => c.completion_date >= from && c.completion_date <= to);
}

// ── Deterministic pseudo-random (no Math.random — stable between renders) ─────

function rand(a: number, b: number): number {
	let n = Math.imul((a + 1) * 2654435761, (b + 1) * 2246822519);
	n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
	n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
	return ((n ^ (n >>> 16)) >>> 0) / 0xffffffff;
}

// ── Encouragements (mirrors src/lib/tasks.ts) ─────────────────────────────────

const ENCOURAGEMENTS: Record<string, string[]> = {
	morning: [
		'Great job taking your morning meds! 🌟',
		"You're so responsible! Keep it up! ✨",
		'Amazing! Your health matters so much! 💜'
	],
	evening: [
		'Wonderful! Evening meds are all done! 🌙',
		"You did it! Have a peaceful night! 💫",
		"You're a superstar! All done! 🎉"
	],
	dinner: [
		'Wonderful! Dinner is done! 🍽️✨',
		"Great job eating! You're doing amazing! 🌟",
		'Nourishing your body — good job! 💛'
	],
	hands: ['Squeaky clean! Amazing job! 🧼✨', 'Clean hands, happy day! 💧', 'So healthy! 🌊'],
	sunlight: [
		'Sunshine superstar! ☀️✨',
		"Fresh air and sunshine — you're awesome! 🌿",
		'Vitamin D done! You rock! 🌞'
	]
};

function encouragementFor(taskId: string, seed: number): string {
	const key = taskId.includes('morning')
		? 'morning'
		: taskId.includes('evening')
			? 'evening'
			: taskId.includes('dinner')
				? 'dinner'
				: taskId.includes('hands')
					? 'hands'
					: 'sunlight';
	const msgs = ENCOURAGEMENTS[key];
	return msgs[seed % msgs.length];
}

function baseHour(taskId: string): number {
	if (taskId.includes('morning')) return 8;
	if (taskId.includes('evening')) return 20;
	if (taskId.includes('dinner')) return 18;
	if (taskId.includes('sunlight')) return 11;
	return 10; // wash hands
}

// ── Completion generator ──────────────────────────────────────────────────────

function generateCompletions(
	tasks: ReportTask[],
	rates: number[],
	days = 30
): Completion[] {
	const out: Completion[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let offset = days - 1; offset >= 0; offset--) {
		const date = addDays(today, -offset);
		const dateStr = toDateStr(date);

		tasks.forEach((task, ti) => {
			if (rand(offset, ti) >= (rates[ti] ?? 0.85)) return;

			const hour = baseHour(task.id) + Math.floor(rand(offset + 50, ti) * 2);
			const minute = Math.floor(rand(offset + 100, ti) * 60);
			const completedAt = new Date(date);
			completedAt.setHours(hour, minute, 0, 0);

			out.push({
				id: `${task.id}-${dateStr}`,
				task_id: task.id,
				completion_date: dateStr,
				completed_at: completedAt.toISOString(),
				encouragement_shown: encouragementFor(task.id, Math.floor(rand(offset, ti + 200) * 100)),
				notes: null
			});
		});
	}
	return out;
}

// ── VIP definitions ───────────────────────────────────────────────────────────

const ALEX_TASKS: ReportTask[] = [
	{ id: 'alex-morning-meds', name: 'Morning Meds', icon: '💊', importance: 3 },
	{ id: 'alex-evening-meds', name: 'Evening Meds', icon: '🌙', importance: 3 },
	{ id: 'alex-eat-dinner', name: 'Eat Dinner', icon: '🍽️', importance: 2 },
	{ id: 'alex-wash-hands', name: 'Wash Hands', icon: '🧼', importance: 1 },
	{ id: 'alex-get-sunlight', name: 'Get Sunlight', icon: '☀️', importance: 1 }
];

const SAM_TASKS: ReportTask[] = [
	{ id: 'sam-morning-meds', name: 'Morning Meds', icon: '💊', importance: 3 },
	{ id: 'sam-evening-meds', name: 'Evening Meds', icon: '🌙', importance: 3 },
	{ id: 'sam-eat-dinner', name: 'Eat Dinner', icon: '🍽️', importance: 2 },
	{ id: 'sam-wash-hands', name: 'Wash Hands', icon: '🧼', importance: 1 }
];

export const MOCK_VIPS: VipSummary[] = [
	{
		id: 'vip-001',
		display_name: 'Alex',
		activeThemeId: 'friendly',
		tasks: ALEX_TASKS,
		// Slightly different rates per task — meds are highest priority
		completions: generateCompletions(ALEX_TASKS, [0.93, 0.88, 0.80, 0.73, 0.68])
	},
	{
		id: 'vip-002',
		display_name: 'Sam',
		activeThemeId: 'lcars',
		tasks: SAM_TASKS,
		completions: generateCompletions(SAM_TASKS, [0.97, 0.95, 0.90, 0.85])
	}
];

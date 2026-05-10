import { fail } from '@sveltejs/kit';
import { addDays, toDateStr } from '$lib/mock-caretaker';
import type { VipSummary, ReportTask, Completion } from '$lib/mock-caretaker';

export const load = async ({ locals }) => {
	const { supabase, user } = locals;

	// Step 1: get VIP IDs linked to this caretaker
	const { data: links } = await supabase
		.from('caretaker_vip')
		.select('vip_id')
		.eq('caretaker_id', user!.id);

	const vipIds = (links ?? []).map((l) => l.vip_id);
	if (vipIds.length === 0) return { vips: [] as VipSummary[] };

	// Step 2: parallel queries for profiles, tasks, and last-30-days completions
	const thirtyDaysAgo = toDateStr(addDays(new Date(), -30));

	const [profilesResult, tasksResult, completionsResult] = await Promise.all([
		supabase
			.from('profiles')
			.select('id, display_name, active_theme_id')
			.in('id', vipIds),
		supabase
			.from('tasks')
			.select('id, vip_id, name, icon, importance, is_active, sort_order, updated_at')
			.in('vip_id', vipIds)
			.order('sort_order'),
		supabase
			.from('task_completions')
			.select('id, task_id, vip_id, completion_date, completed_at, encouragement_shown, notes')
			.in('vip_id', vipIds)
			.gte('completion_date', thirtyDaysAgo)
	]);

	// Build VipSummary[] from flat query results
	const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));

	const tasksByVip = new Map<string, ReportTask[]>();
	for (const t of tasksResult.data ?? []) {
		if (!tasksByVip.has(t.vip_id)) tasksByVip.set(t.vip_id, []);
		tasksByVip.get(t.vip_id)!.push({
			id: t.id,
			name: t.name,
			icon: t.icon,
			importance: t.importance as 1 | 2 | 3,
			deletedAt: t.is_active ? undefined : t.updated_at
		});
	}

	const completionsByVip = new Map<string, Completion[]>();
	for (const c of completionsResult.data ?? []) {
		if (!completionsByVip.has(c.vip_id)) completionsByVip.set(c.vip_id, []);
		completionsByVip.get(c.vip_id)!.push({
			id: c.id,
			task_id: c.task_id,
			completion_date: c.completion_date,
			completed_at: c.completed_at,
			encouragement_shown: c.encouragement_shown,
			notes: c.notes
		});
	}

	const vips: VipSummary[] = vipIds.map((id) => ({
		id,
		display_name: profileMap.get(id)?.display_name ?? 'Unknown',
		activeThemeId: profileMap.get(id)?.active_theme_id ?? 'friendly',
		tasks: tasksByVip.get(id) ?? [],
		completions: completionsByVip.get(id) ?? []
	}));

	return { vips };
};

export const actions = {
	updateVip: async ({ request, locals }) => {
		const form = await request.formData();
		const vipId = form.get('vipId') as string;
		const display_name = (form.get('display_name') as string).trim();
		const active_theme_id = form.get('active_theme_id') as string;

		if (!display_name) return fail(400, { message: 'Name is required.' });

		const { error } = await locals.supabase
			.from('profiles')
			.update({ display_name, active_theme_id })
			.eq('id', vipId);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	}
};

import { error, fail } from '@sveltejs/kit';
import { addDays, toDateStr } from '$lib/mock-caretaker';
import type { ReportTask, Completion } from '$lib/mock-caretaker';

export const load = async ({ locals, params }) => {
	const { supabase } = locals;
	const { vipId } = params;

	// Verify caretaker relationship + load VIP profile
	const [profileResult, tasksResult, completionsResult] = await Promise.all([
		supabase
			.from('profiles')
			.select('id, display_name, active_theme_id')
			.eq('id', vipId)
			.single(),
		supabase
			.from('tasks')
			.select('id, name, icon, importance, is_active, sort_order, updated_at')
			.eq('vip_id', vipId)
			.order('sort_order'),
		supabase
			.from('task_completions')
			.select('id, task_id, vip_id, completion_date, completed_at, encouragement_shown, notes')
			.eq('vip_id', vipId)
			.gte('completion_date', toDateStr(addDays(new Date(), -90)))
	]);

	if (profileResult.error || !profileResult.data) {
		error(404, 'Patient not found');
	}

	const vipProfile = profileResult.data;

	const tasks: ReportTask[] = (tasksResult.data ?? []).map((t) => ({
		id: t.id,
		name: t.name,
		icon: t.icon,
		importance: t.importance as 1 | 2 | 3,
		deletedAt: t.is_active ? undefined : t.updated_at
	}));

	const completions: Completion[] = (completionsResult.data ?? []).map((c) => ({
		id: c.id,
		task_id: c.task_id,
		completion_date: c.completion_date,
		completed_at: c.completed_at,
		encouragement_shown: c.encouragement_shown,
		notes: c.notes
	}));

	return {
		vip: {
			id: vipId,
			display_name: vipProfile.display_name,
			activeThemeId: vipProfile.active_theme_id,
			tasks,
			completions
		}
	};
};

export const actions = {
	addTask: async ({ request, locals, params }) => {
		const form = await request.formData();
		const { error: err } = await locals.supabase.from('tasks').insert({
			vip_id: params.vipId,
			created_by: locals.user!.id,
			name: (form.get('name') as string).trim(),
			icon: (form.get('icon') as string).trim(),
			importance: Number(form.get('importance')) as 1 | 2 | 3
		});
		if (err) return fail(500, { message: err.message });
		return { success: true };
	},

	updateTask: async ({ request, locals }) => {
		const form = await request.formData();
		const { error: err } = await locals.supabase
			.from('tasks')
			.update({
				name: (form.get('name') as string).trim(),
				icon: (form.get('icon') as string).trim(),
				importance: Number(form.get('importance')) as 1 | 2 | 3
			})
			.eq('id', form.get('taskId') as string);
		if (err) return fail(500, { message: err.message });
		return { success: true };
	},

	deleteTask: async ({ request, locals }) => {
		const form = await request.formData();
		const { error: err } = await locals.supabase
			.from('tasks')
			.update({ is_active: false })
			.eq('id', form.get('taskId') as string);
		if (err) return fail(500, { message: err.message });
		return { success: true };
	},

	restoreTask: async ({ request, locals }) => {
		const form = await request.formData();
		const { error: err } = await locals.supabase
			.from('tasks')
			.update({ is_active: true })
			.eq('id', form.get('taskId') as string);
		if (err) return fail(500, { message: err.message });
		return { success: true };
	}
};

import { fail } from '@sveltejs/kit';
import type { Task } from '$lib/tasks';

export const load = async ({ locals }) => {
	const { supabase, user, profile } = locals;

	const today = new Date().toISOString().split('T')[0]; // UTC date YYYY-MM-DD

	const [tasksResult, completionsResult] = await Promise.all([
		supabase
			.from('tasks')
			.select('id, name, icon, importance, gradient_from, gradient_to, encouragements')
			.eq('vip_id', user!.id)
			.eq('is_active', true)
			.order('sort_order'),
		supabase
			.from('task_completions')
			.select('task_id, encouragement_shown')
			.eq('vip_id', user!.id)
			.eq('completion_date', today)
	]);

	const tasks: Task[] = (tasksResult.data ?? []).map((row) => ({
		id: row.id,
		name: row.name,
		icon: row.icon,
		importance: row.importance as 1 | 2 | 3,
		gradient: [row.gradient_from, row.gradient_to] as [string, string],
		encouragements: row.encouragements ?? []
	}));

	// Map of task_id → encouragement shown when completing today
	const completedToday: Record<string, string> = {};
	for (const c of completionsResult.data ?? []) {
		completedToday[c.task_id] = c.encouragement_shown ?? '';
	}

	return { profile, tasks, completedToday };
};

export const actions = {
	complete: async ({ request, locals }) => {
		const { supabase, user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const taskId = form.get('taskId') as string;
		const encouragement = form.get('encouragement') as string;
		const today = new Date().toISOString().split('T')[0];

		const { error } = await supabase.from('task_completions').upsert(
			{
				task_id: taskId,
				vip_id: user.id,
				completion_date: today,
				completed_at: new Date().toISOString(),
				encouragement_shown: encouragement || null
			},
			{ onConflict: 'task_id,vip_id,completion_date' }
		);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	}
};

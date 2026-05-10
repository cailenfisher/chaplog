import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (locals.profile?.role !== 'caretaker') redirect(303, '/');
	return {};
};

import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) redirect(303, '/auth/login?error=callback_failed');
	}

	// Determine role-based destination
	const { user } = await locals.safeGetSession();
	if (user) {
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		redirect(303, profile?.role === 'caretaker' ? '/caretaker' : next);
	}

	redirect(303, '/auth/login');
};

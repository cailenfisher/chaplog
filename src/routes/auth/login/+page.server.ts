import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	login: async ({ locals, url }) => {
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) return fail(500, { message: error.message });
		if (data.url) redirect(303, data.url);
	}
};

import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { Database } from '$lib/database.types';

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});

	// Validates the JWT before returning the session (safe for server use)
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const path = event.url.pathname;
	const isPublic = path.startsWith('/auth') || path.startsWith('/demo');

	// Redirect unauthenticated users to login (except public routes)
	if (!session && !isPublic) {
		redirect(303, '/auth/login');
	}

	if (session && user) {
		// Load profile once per request for role-based routing
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role, display_name, active_theme_id')
			.eq('id', user.id)
			.single();

		event.locals.profile = profile as App.Locals['profile'];

		// Redirect caretakers away from VIP view and vice versa
		if (path === '/' && profile?.role === 'caretaker') redirect(303, '/caretaker');
		if (path.startsWith('/caretaker') && profile?.role === 'vip') redirect(303, '/');

		// Redirect already-logged-in users away from login
		if (path === '/auth/login') {
			redirect(303, profile?.role === 'caretaker' ? '/caretaker' : '/');
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabaseHandle, authGuard);

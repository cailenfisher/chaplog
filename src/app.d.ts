import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			profile: {
				role: 'caretaker' | 'vip';
				display_name: string;
				active_theme_id: string;
			} | null;
		}
		interface PageData {
			session: Session | null;
		}
	}
}

export {};

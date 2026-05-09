// =============================================================================
// ChapLog — Database Types
// =============================================================================
// Hand-authored equivalent of `supabase gen types typescript`.
// Re-generate with the CLI after any migration:
//   supabase gen types typescript --local > src/lib/database.types.ts
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			// ── profiles ───────────────────────────────────────────────────────
			profiles: {
				Row: {
					id: string;
					role: Database['public']['Enums']['user_role'];
					display_name: string;
					avatar_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string; // must match auth.users.id
					role: Database['public']['Enums']['user_role'];
					display_name: string;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					role?: Database['public']['Enums']['user_role'];
					display_name?: string;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};

			// ── caretaker_vip ──────────────────────────────────────────────────
			caretaker_vip: {
				Row: {
					id: string;
					caretaker_id: string;
					vip_id: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					caretaker_id: string;
					vip_id: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					caretaker_id?: string;
					vip_id?: string;
					created_at?: string;
				};
			};

			// ── tasks ──────────────────────────────────────────────────────────
			tasks: {
				Row: {
					id: string;
					vip_id: string;
					created_by: string;
					name: string;
					icon: string;
					importance: 1 | 2 | 3;
					gradient_from: string;
					gradient_to: string;
					encouragements: string[];
					is_active: boolean;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					vip_id: string;
					created_by: string;
					name: string;
					icon?: string;
					importance?: 1 | 2 | 3;
					gradient_from?: string;
					gradient_to?: string;
					encouragements?: string[];
					is_active?: boolean;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					vip_id?: string;
					created_by?: string;
					name?: string;
					icon?: string;
					importance?: 1 | 2 | 3;
					gradient_from?: string;
					gradient_to?: string;
					encouragements?: string[];
					is_active?: boolean;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
			};

			// ── task_completions ───────────────────────────────────────────────
			task_completions: {
				Row: {
					id: string;
					task_id: string;
					vip_id: string;
					/** ISO 8601 date string, e.g. "2026-05-09" */
					completion_date: string;
					/** ISO 8601 timestamptz string */
					completed_at: string;
					encouragement_shown: string | null;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					task_id: string;
					vip_id: string;
					completion_date?: string;
					completed_at?: string;
					encouragement_shown?: string | null;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					task_id?: string;
					vip_id?: string;
					completion_date?: string;
					completed_at?: string;
					encouragement_shown?: string | null;
					/** Only caretakers may update this field (enforced in the app layer too). */
					notes?: string | null;
					created_at?: string;
				};
			};
		};

		Views: {
			// ── caretaker_report ───────────────────────────────────────────────
			// Denormalised read model joining completions → tasks → profiles.
			// Inherits RLS from the underlying tables (security_invoker = true).
			caretaker_report: {
				Row: {
					id: string;
					completion_date: string;
					completed_at: string;
					encouragement_shown: string | null;
					notes: string | null;
					task_name: string;
					task_icon: string;
					task_importance: 1 | 2 | 3;
					vip_name: string;
					vip_id: string;
				};
			};
		};

		Functions: {
			/** Returns the role of the currently authenticated user. */
			my_role: {
				Args: Record<never, never>;
				Returns: Database['public']['Enums']['user_role'];
			};
			/** Returns true if the current user is a caretaker for the given VIP. */
			is_caretaker_of: {
				Args: { target_vip_id: string };
				Returns: boolean;
			};
		};

		Enums: {
			user_role: 'caretaker' | 'vip';
		};
	};
};

// =============================================================================
// Generic helpers (mirrors the pattern from supabase-js codegen)
// =============================================================================

export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];

export type Views<T extends keyof Database['public']['Views']> =
	Database['public']['Views'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
	Database['public']['Enums'][T];

// =============================================================================
// Named aliases — import these in the rest of the app
// =============================================================================

export type UserRole = Enums<'user_role'>;

export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;

export type CaretakerVip = Tables<'caretaker_vip'>;

export type DbTask = Tables<'tasks'>;
export type DbTaskInsert = TablesInsert<'tasks'>;
export type DbTaskUpdate = TablesUpdate<'tasks'>;

export type TaskCompletion = Tables<'task_completions'>;
export type TaskCompletionInsert = TablesInsert<'task_completions'>;

/** Row returned by the caretaker_report view — ready to display in a report UI. */
export type CaretakerReportRow = Views<'caretaker_report'>;

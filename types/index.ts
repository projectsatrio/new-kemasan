// types/index.ts
export type UserRole = 'admin' | 'accounting' | 'marketing' | 'it-department';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

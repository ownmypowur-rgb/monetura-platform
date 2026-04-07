export type MemberTier = "free" | "community" | "software" | "founder" | "admin";

export interface DashboardUser {
  name: string;
  memberTier: MemberTier;
  founderNumber: number | null;
}

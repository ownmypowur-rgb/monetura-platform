export type MemberTier = "free" | "community" | "software" | "founder";

export interface DashboardUser {
  name: string;
  memberTier: MemberTier;
  founderNumber: number | null;
}

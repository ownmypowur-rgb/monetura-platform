import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#2C2420" }}
    >
      <div className="text-center">
        <h1
          className="text-4xl font-light mb-4"
          style={{
            color: "#D4A853",
            fontFamily: "var(--font-heading)",
          }}
        >
          Welcome, {session.user.name}
        </h1>
        <p style={{ color: "#8B6E52" }}>
          Dashboard — coming soon
        </p>
      </div>
    </main>
  );
}

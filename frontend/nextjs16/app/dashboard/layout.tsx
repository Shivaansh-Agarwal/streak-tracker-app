import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileProvider } from "./profile-context";
import ProfileSetupForm from "./profile-setup-form";
import type { Profile } from "@/lib/types";

// Server components run inside the Next.js server process itself, so this
// call bypasses the browser-facing /api/* rewrite and hits the backend's
// internal URL directly, forwarding the incoming request's cookies by hand.
const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const response = await fetch(`${backendUrl}/users/me`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  const profile: Profile = await response.json();

  if (profile.status === "PENDING_PROFILE") {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <ProfileSetupForm />
      </div>
    );
  }

  return <ProfileProvider profile={profile}>{children}</ProfileProvider>;
}

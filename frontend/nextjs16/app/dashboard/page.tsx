import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfileSetupForm from "./profile-setup-form";
import DashboardContent from "./dashboard-content";
import type { Profile } from "@/lib/types";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

export default async function DashboardPage() {
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

  return <DashboardContent profile={profile} />;
}

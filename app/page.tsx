import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import OnboardingForm from "./onboarding-form";
import { getBusinessContext } from "@/lib/business-context";

export default async function Home() {
  const context = await getBusinessContext();
  if (!context) redirect("/login");

  const name = context.user.user_metadata?.full_name || context.user.email?.split("@")[0] || "Administrador";
  if (!context.membership) return <OnboardingForm userName={name} />;

  const business = Array.isArray(context.membership.businesses)
    ? context.membership.businesses[0]
    : context.membership.businesses;

  return <DashboardClient businessName={business?.name || "Mi negocio"} userName={name} />;
}

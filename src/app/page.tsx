import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { LandingPage } from "@/features/landing/LandingPage";

export const metadata: Metadata = {
	title: { absolute: "Budgety · Know where every naira went" },
	description:
		"Keep your bank accounts, mobile wallets and cash in one place, split into spaces for home, business and savings.",
};

// Signed-in users go straight to the app; everyone else sees the landing page.
export default async function Home() {
	const session = await auth();
	if (session) redirect("/dashboard");
	return <LandingPage />;
}

import { redirect } from "next/navigation";

// Parity with the old catch-all route that redirected unknown paths to the
// dashboard. Middleware then bounces unauthenticated users on to /login.
export default function NotFound() {
	redirect("/dashboard");
}

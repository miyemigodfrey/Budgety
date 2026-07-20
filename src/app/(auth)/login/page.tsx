import { Suspense } from "react";
import LoginPage from "@/features/login/login";

// LoginPage reads useSearchParams(), which requires a Suspense boundary so the
// rest of the page can be statically rendered.
export default function Page() {
	return (
		<Suspense>
			<LoginPage />
		</Suspense>
	);
}

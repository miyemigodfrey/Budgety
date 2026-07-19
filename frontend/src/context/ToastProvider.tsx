import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/hooks/useTheme";

export default function ToastProvider() {
	const { theme } = useTheme();

	return (
		<ToastContainer
			position="top-right"
			autoClose={3000}
			hideProgressBar={false}
			// Without this, toasts render as white cards on a dark page.
			theme={theme}
		/>
	);
}

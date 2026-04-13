import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TransactionPage from "@/features/transactions/TransactionPage";
import Dashboard from "./features/dashboard/DashboardPage";
import SourcePage from "./features/addsource/SourcePage";
import ReportPage from "./features/reports/ReportPage";
import SettingPage from "./features/settingPage/settings";
import ReconcilationPage from "./features/reconcilation/ReconcilationPage";
import LoginPage from "./features/login/login";
import SignupPage from "./features/signup/signup";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import { AuthProvider } from "./context/AuthProvider";
import SourcesIdPage from "./features/addsource/SourceDetails.tsx";

const App = () => {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					{/* ============ PUBLIC ROUTES ============
					    These pages render full-screen without the sidebar or navbar.
					    They are accessible whether the user is logged in or not. */}
					<Route path="/login" element={<LoginPage />} />
					<Route path="/signup" element={<SignupPage />} />

					{/* ============ PROTECTED ROUTES ============
					    All child routes below are wrapped by ProtectedLayout which:
					    - Checks if the user is authenticated via useAuth()
					    - Redirects to /login if not (saving the intended destination)
					    - Renders AppContainer (sidebar + navbar) around <Outlet />
					    This is a React Router v6 "layout route" — it has no path,
					    so it matches whenever any of its children match. */}
					<Route element={<ProtectedLayout />}>
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/source" element={<SourcePage />} />
						<Route path="/source/:id" element={<SourcesIdPage />} />
						<Route path="/transaction" element={<TransactionPage />} />
						<Route path="/report" element={<ReportPage />} />
						<Route path="/setting" element={<SettingPage />} />
						<Route path="/reconcilation" element={<ReconcilationPage />} />
					</Route>

					{/* ============ ROOT REDIRECT ============
					    Visiting "/" sends the user to /dashboard.
					    If they're not logged in, ProtectedLayout will bounce them to /login. */}
					<Route path="/" element={<Navigate to="/login" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
};

export default App;

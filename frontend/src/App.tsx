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
import ManageSourcePage from "./features/settingPage/settings-source.tsx";
import SettingLayout from "./features/settingPage/settingsLayout.tsx";
import ToastProvider from "./context/ToastProvider.tsx";

const App = () => {
	return (
		<AuthProvider>
			<BrowserRouter>
				<ToastProvider />
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/signup" element={<SignupPage />} />

					<Route element={<ProtectedLayout />}>
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/source" element={<SourcePage />} />
						<Route path="/sources/:id" element={<SourcesIdPage />} />
						<Route path="/transaction" element={<TransactionPage />} />
						<Route path="/report" element={<ReportPage />} />
						<Route path="/setting" element={<SettingLayout />}>
							<Route index element={<SettingPage />} />
							<Route path="/setting/sources" element={<ManageSourcePage />} />
						</Route>
						<Route path="/reconcilation" element={<ReconcilationPage />} />
					</Route>

					<Route path="/" element={<Navigate to="/login" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
};

export default App;

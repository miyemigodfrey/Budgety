import { BrowserRouter, Routes, Route } from "react-router-dom";
import TransactionPage from "@/features/transactions/TransactionPage";
import Dashboard from "./features/dashboard/DashboardPage";
import SourcePage from "./features/addsource/SourcePage";
import ReportPage from "./features/reports/ReportPage";
import AppContainer from "@/components/layout/AppContainer";
import SettingPage from "./features/settingPage/settings";
import ReconcilationPage from "./features/reconcilation/ReconcilationPage";
import SourceIdPage from "./features/addsource/ID/source";
import LoginPage from "./features/login/login";
import SignupPage from "./features/signup/signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthProvider";

const App = () => {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AppContainer>
					<Routes>
						<Route path="/" element={<LoginPage />} />

						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/source"
							element={
								<ProtectedRoute>
									<SourcePage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/transaction"
							element={
								<ProtectedRoute>
									<TransactionPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/report"
							element={
								<ProtectedRoute>
									<ReportPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/setting"
							element={
								<ProtectedRoute>
									<SettingPage />
								</ProtectedRoute>
							}
						/>
						<Route path="/reconcilation" element={<ReconcilationPage />} />
						<Route path="/source/id" element={<SourceIdPage />} />
						<Route path="/login" element={<LoginPage />} />

						<Route path="/signup" element={<SignupPage />} />
					</Routes>
				</AppContainer>
			</BrowserRouter>
		</AuthProvider>
	);
};

export default App;

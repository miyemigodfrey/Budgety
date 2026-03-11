import { BrowserRouter, Routes, Route } from "react-router-dom";
import TransactionPage from "@/features/transactions/TransactionPage";
import Dashboard from "./features/dashboard/DashboardPage";
import SourcePage from "./features/addsource/SourcePage";
import ReportPage from "./features/reports/ReportPage";
import AppContainer from "@/components/layout/AppContainer";
import SettingPage from "./features/settingPage/settings";
import ReconcilationPage from "./features/reconcilation/ReconcilationPage";

const App = () => {
	return (
		<BrowserRouter>
			<AppContainer>
				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/source" element={<SourcePage />} />
					<Route path="/transaction" element={<TransactionPage />} />
					<Route path="/report" element={<ReportPage />} />
					<Route path="/setting" element={<SettingPage />} />
					<Route path="/reconcilation" element={<ReconcilationPage />} />
				</Routes>
			</AppContainer>
		</BrowserRouter>
	);
};

export default App;

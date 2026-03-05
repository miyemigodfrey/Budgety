import Home from "@/features/home/Home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TransactionPage from "@/features/transactions/TransactionPage";

const App = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/" element={<Home />} />
				<Route path="/transaction" element={<TransactionPage />} />
				<Route path="/" element={<Home />} />
			</Routes>
		</BrowserRouter>
	);
};

export default App;

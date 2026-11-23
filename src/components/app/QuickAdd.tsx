"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AddTransactionModal from "@/features/transactions/transactionModal";

type TxType = "inflow" | "outflow" | "transfer";
const isTxType = (v: unknown): v is TxType =>
	v === "inflow" || v === "outflow" || v === "transfer";

type QuickAddValue = {
	/**
	 * Opens the shared Add transaction dialog (top bar, mobile + button, pages).
	 * Pass "transfer" etc. to start on that tab; anything else (such as a click
	 * event, when used directly as onClick) starts on Inflow.
	 */
	openAddTransaction: (type?: unknown) => void;
	/** Bumps whenever data changes from the shell; the shell remounts the page on it. */
	dataVersion: number;
	/** Tell the shell the data changed so the current page refetches. */
	refreshPage: () => void;
};

const QuickAddContext = createContext<QuickAddValue | undefined>(undefined);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [type, setType] = useState<TxType>("inflow");
	const [dataVersion, setDataVersion] = useState(0);
	const refreshPage = useCallback(() => setDataVersion((v) => v + 1), []);
	const openAddTransaction = useCallback((t?: unknown) => {
		setType(isTxType(t) ? t : "inflow");
		setOpen(true);
	}, []);
	const value = useMemo(
		() => ({ openAddTransaction, dataVersion, refreshPage }),
		[openAddTransaction, dataVersion, refreshPage],
	);
	return (
		<QuickAddContext.Provider value={value}>
			{children}
			<AddTransactionModal open={open} setOpen={setOpen} onCreated={refreshPage} initialType={type} />
		</QuickAddContext.Provider>
	);
}

export function useQuickAdd() {
	const ctx = useContext(QuickAddContext);
	if (!ctx) throw new Error("useQuickAdd must be used inside the app shell");
	return ctx;
}

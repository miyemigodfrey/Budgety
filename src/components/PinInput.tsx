"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const LENGTH = 4;

type Props = {
	/** Fired when all 4 digits are entered. */
	onComplete: (pin: string) => void;
	/** Red dots + error message; the buffer clears on the next keypress. */
	error?: string | null;
	/** Bump this number to clear the entry (e.g. after a failed attempt). */
	resetSignal?: number;
	disabled?: boolean;
};

/**
 * A 4-digit PIN entry: masked dots + an on-screen numeric keypad, with physical
 * keyboard support. Reused by the lock screen and the set/confirm PIN flow.
 */
export function PinInput({ onComplete, error, resetSignal, disabled }: Props) {
	const [pin, setPin] = useState("");
	const firedRef = useRef(false);

	useEffect(() => {
		setPin("");
		firedRef.current = false;
	}, [resetSignal]);

	// Fire completion from an effect (not inside the state updater) so it stays
	// a pure update and runs exactly once per full entry.
	useEffect(() => {
		if (pin.length === LENGTH && !firedRef.current) {
			firedRef.current = true;
			onComplete(pin);
		} else if (pin.length < LENGTH) {
			firedRef.current = false;
		}
	}, [pin, onComplete]);

	const press = useCallback(
		(digit: string) => {
			if (disabled) return;
			setPin((prev) => (prev.length >= LENGTH ? prev : prev + digit));
		},
		[disabled],
	);

	const back = useCallback(() => {
		if (disabled) return;
		setPin((prev) => prev.slice(0, -1));
	}, [disabled]);

	// Physical keyboard (desktop convenience).
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key >= "0" && e.key <= "9") press(e.key);
			else if (e.key === "Backspace") back();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [press, back]);

	// Show the error until the user starts a fresh entry.
	const showError = !!error && pin.length === 0;

	return (
		<div className="flex flex-col items-center gap-6">
			{/* Dots */}
			<div className="flex items-center gap-4">
				{Array.from({ length: LENGTH }).map((_, i) => (
					<span
						key={i}
						className={cn(
							"h-4 w-4 rounded-full border-2 transition-colors",
							showError
								? "border-danger"
								: i < pin.length
									? "border-brand bg-brand"
									: "border-muted-foreground/40",
						)}
					/>
				))}
			</div>

			{showError && (
				<p className="text-sm font-medium text-danger">{error}</p>
			)}

			{/* Keypad */}
			<div className="grid grid-cols-3 gap-3">
				{["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
					<button
						key={d}
						type="button"
						disabled={disabled}
						onClick={() => press(d)}
						className="flex h-14 w-14 items-center justify-center rounded-full border border-border text-xl font-semibold text-foreground transition hover:bg-muted active:scale-95 disabled:opacity-40">
						{d}
					</button>
				))}
				<span />
				<button
					type="button"
					disabled={disabled}
					onClick={() => press("0")}
					className="flex h-14 w-14 items-center justify-center rounded-full border border-border text-xl font-semibold text-foreground transition hover:bg-muted active:scale-95 disabled:opacity-40">
					0
				</button>
				<button
					type="button"
					disabled={disabled}
					onClick={back}
					aria-label="Delete"
					className="flex h-14 w-14 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-95 disabled:opacity-40">
					<Delete className="size-5" />
				</button>
			</div>
		</div>
	);
}

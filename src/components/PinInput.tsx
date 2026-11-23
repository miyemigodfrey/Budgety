"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";

const LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

type Props = {
	/** Fired when all 4 digits are entered. */
	onComplete: (pin: string) => void;
	/** Red dots + error message; the buffer clears on the next keypress. */
	error?: string | null;
	/** Bump this number to clear the entry (e.g. after a failed attempt). */
	resetSignal?: number;
	disabled?: boolean;
	/** Optional heading above the dots (e.g. "Enter your PIN"). */
	title?: string;
	/** Muted helper line under the dots when there's no error. */
	hint?: string;
	/** Shown in brand colour under the dots while `disabled` after a full entry. */
	busyText?: string;
};

/**
 * A 4-digit PIN entry: masked dots + an on-screen numeric keypad, with physical
 * keyboard support. Reused by the lock screen and the set/confirm PIN flow.
 * Canvas classes: .pin-dots, .keypad, .key (budgety.css).
 */
export function PinInput({ onComplete, error, resetSignal, disabled, title, hint, busyText }: Props) {
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
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			const target = e.target as HTMLElement | null;
			if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
			if (e.key >= "0" && e.key <= "9" && e.key.length === 1) {
				e.preventDefault();
				press(e.key);
			} else if (e.key === "Backspace") {
				e.preventDefault();
				back();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [press, back]);

	// Show the error until the user starts a fresh entry.
	const showError = !!error && pin.length === 0;
	const busy = !!disabled && pin.length === LENGTH && !!busyText;
	const status = showError ? error : busy ? busyText : hint;
	const statusColor = showError ? "var(--danger)" : busy ? "var(--brand)" : "var(--muted-ink)";

	return (
		<div className="stack-sm" style={{ alignItems: "center", gap: 20 }}>
			<div className="stack-sm" style={{ alignItems: "center", gap: 14 }}>
				{title && <h2 className="t-h2">{title}</h2>}
				<div className="pin-dots" role="img" aria-label={`${pin.length} of ${LENGTH} digits entered`}>
					{Array.from({ length: LENGTH }).map((_, i) => (
						<span
							key={i}
							className={!showError && i < pin.length ? "on" : undefined}
							style={showError ? { borderColor: "var(--danger)" } : undefined}
						/>
					))}
				</div>
				{(status || hint !== undefined) && (
					<p
						className="t-sm"
						role={showError ? "alert" : undefined}
						aria-live={showError ? undefined : "polite"}
						style={{ minHeight: 20, color: statusColor, fontWeight: 600 }}>
						{status}
					</p>
				)}
			</div>

			<div className="keypad">
				{KEYS.map((k, i) => {
					if (k === "") return <span key={`blank-${i}`} aria-hidden="true" />;
					if (k === "del")
						return (
							<button
								key="del"
								className="key ghost"
								type="button"
								disabled={disabled}
								onClick={back}
								aria-label="Delete last digit"
								style={disabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}>
								<Delete className="ic ic-lg" />
							</button>
						);
					return (
						<button
							key={k}
							className="key"
							type="button"
							disabled={disabled}
							onClick={() => press(k)}
							aria-label={k}
							style={disabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}>
							{k}
						</button>
					);
				})}
			</div>
		</div>
	);
}

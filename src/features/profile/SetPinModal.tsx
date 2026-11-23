"use client";

import { useEffect, useState } from "react";
import UniversalModal from "@/components/ui/modal";
import { PinInput } from "@/components/PinInput";
import { setPin } from "@/api/account";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
	/** Called after the PIN is saved (e.g. to enable App Lock + refresh state). */
	onSaved: () => void;
};

/** Two-step "set a 4-digit PIN": enter it, then confirm it. */
export default function SetPinModal({ open, setOpen, onSaved }: Props) {
	const [first, setFirst] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [resetSignal, setResetSignal] = useState(0);
	const [saving, setSaving] = useState(false);

	// Reset the flow whenever the modal opens.
	useEffect(() => {
		if (open) {
			setFirst(null);
			setError(null);
			setResetSignal((n) => n + 1);
		}
	}, [open]);

	const handleComplete = async (pin: string) => {
		if (first === null) {
			setFirst(pin);
			setError(null);
			setResetSignal((n) => n + 1);
			return;
		}
		if (pin !== first) {
			setFirst(null);
			setError("PINs didn't match. Start again.");
			setResetSignal((n) => n + 1);
			return;
		}
		setSaving(true);
		try {
			await setPin(pin);
			toast.success("PIN saved");
			setOpen(false);
			onSaved();
		} catch (err) {
			setError(getErrorMessage(err, "Couldn't save the PIN."));
			setFirst(null);
			setResetSignal((n) => n + 1);
		} finally {
			setSaving(false);
		}
	};

	const step = first === null ? 1 : 2;

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			maxWidth={420}
			title={step === 1 ? "Create a PIN" : "Confirm your PIN"}
			description={
				step === 1
					? "Choose a 4-digit PIN to unlock the app, or skip it for now."
					: "Enter the same 4 digits again."
			}
			footer={
				<button
					className="btn btn-ghost btn-block"
					type="button"
					disabled={saving}
					onClick={() => setOpen(false)}>
					Not now
				</button>
			}>
			<div className="stack-sm" style={{ alignItems: "center", gap: 16, padding: "4px 0 8px" }}>
				{/* Step indicator: 1 enter, 2 confirm */}
				<div className="row-f" style={{ gap: 6 }} aria-hidden="true">
					{[1, 2].map((n) => (
						<span
							key={n}
							style={{
								width: 24,
								height: 4,
								borderRadius: 999,
								background: n <= step ? "var(--brand)" : "var(--sunken)",
							}}
						/>
					))}
				</div>
				<span className="t-over">Step {step} of 2</span>
				<PinInput
					onComplete={handleComplete}
					error={error}
					resetSignal={resetSignal}
					disabled={saving}
					hint={step === 1 ? "Pick 4 digits you'll remember" : "Re-enter to confirm"}
					busyText="Saving…"
				/>
			</div>
		</UniversalModal>
	);
}

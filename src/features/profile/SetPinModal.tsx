"use client";

import { useEffect, useState } from "react";
import UniversalModal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
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

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title={first === null ? "Create a PIN" : "Confirm your PIN"}
			description={
				first === null
					? "Choose a 4-digit PIN to unlock the app, or skip it for now."
					: "Enter the same 4 digits again."
			}
			footer={
				<Button
					variant="ghost"
					disabled={saving}
					onClick={() => setOpen(false)}
					className="w-full text-muted-foreground">
					Not now
				</Button>
			}>
			<div className="flex w-full justify-center py-4">
				<PinInput
					onComplete={handleComplete}
					error={error}
					resetSignal={resetSignal}
					disabled={saving}
				/>
			</div>
		</UniversalModal>
	);
}

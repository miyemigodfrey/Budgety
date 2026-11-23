"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import UniversalModal from "@/components/ui/modal";
import { createSource, type Source } from "@/api/sources";
import { useSpace } from "@/hooks/useSpace";
import { parseMoneyInput, formatMoneyInput } from "@/lib/money";
import { getErrorMessage } from "@/lib/apiError";
import { toast } from "react-toastify";
import { sourceLook } from "./sourceUi";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
	onCreated?: (data: Source) => void;
};

/** Quick-pick names under the name field (one tap fills it in). */
const PICKS = ["Access Bank", "Opay", "Kuda", "Cash"];

export default function AddSourceModal({ open, setOpen, onCreated }: Props) {
	const id = useId();
	const [name, setName] = useState("");
	const [balance, setBalance] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const { activeSpaceId, activeSpace, isAllView, refreshSpaces } = useSpace();

	const handleSubmit = async () => {
		// A source must live in one space; you can't add from the "All" view.
		if (isAllView || !activeSpaceId) {
			toast.error("Open a space first, then add a source to it.");
			return;
		}

		if (!name.trim()) {
			toast.error("Please enter a source name.");
			return;
		}

		// An empty opening balance means "start at zero" — don't force a number.
		const parsedBalance = balance.trim() === "" ? 0 : parseMoneyInput(balance);

		if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
			toast.error("Please enter a valid opening balance.");
			return;
		}

		try {
			setIsSaving(true);
			const created = await createSource({
				name: name.trim(),
				balance: parsedBalance,
				spaceId: activeSpaceId,
			});

			toast.success("Source created successfully");
			onCreated?.(created);
			// Keep the Spaces tab's source count current without a manual reload.
			void refreshSpaces();
			setName("");
			setBalance("");
			setOpen(false);
		} catch (error) {
			console.error("Failed to create source:", error);
			toast.error(getErrorMessage(error, "Failed to create source"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Add a source"
			description={
				isAllView ? (
					"Open a space first — sources belong to a single space."
				) : (
					<>
						A bank account, wallet or cash in{" "}
						<strong className="t-fg2">{activeSpace?.name ?? "this space"}</strong>.
					</>
				)
			}
			footer={
				<>
					<button type="button" className="btn btn-ghost btn-lg grow" onClick={() => setOpen(false)}>
						Maybe later
					</button>
					<button
						type="button"
						className="btn btn-primary btn-lg grow"
						disabled={isSaving || isAllView}
						onClick={handleSubmit}>
						<Plus className="ic ic-sm" />
						{isSaving ? "Adding…" : "Add source"}
					</button>
				</>
			}>
			<form
				className="stack"
				style={{ gap: 16 }}
				onSubmit={(e) => e.preventDefault()}
				onKeyDown={(e) => {
					// Enter in either text field saves.
					if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
						e.preventDefault();
						if (!isSaving) void handleSubmit();
					}
				}}>
				<div className="field">
					<label className="label" htmlFor={`${id}-name`}>
						Source name
					</label>
					<input
						id={`${id}-name`}
						className="input"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Opay, Access Bank, Cash"
						autoComplete="off"
					/>
					<div className="row-f wrap" style={{ gap: 8, marginTop: 4 }} role="group" aria-label="Quick pick">
						<span className="t-xs t-muted" aria-hidden="true">
							Quick pick:
						</span>
						{PICKS.map((label, i) => {
							const { Icon } = sourceLook(label, i);
							const on = name === label;
							return (
								<button
									key={label}
									type="button"
									className={`chip${on ? " on" : ""}`}
									style={{ height: 30, padding: "0 12px", fontSize: 12 }}
									aria-pressed={on}
									onClick={() => setName(label)}>
									<Icon className="ic ic-xs" />
									{label}
								</button>
							);
						})}
					</div>
				</div>

				<div className="field">
					<label className="label" htmlFor={`${id}-balance`}>
						Opening balance
					</label>
					<div className="control">
						<span className="cur" aria-hidden="true">
							₦
						</span>
						<input
							id={`${id}-balance`}
							className="input input-amt"
							value={balance}
							onChange={(e) => setBalance(formatMoneyInput(e.target.value))}
							inputMode="decimal"
							placeholder="0.00"
							aria-describedby={`${id}-balance-hint`}
						/>
					</div>
					<span className="hint" id={`${id}-balance-hint`}>
						What’s in it right now. You can reconcile against the real figure any time.
					</span>
				</div>
			</form>
		</UniversalModal>
	);
}

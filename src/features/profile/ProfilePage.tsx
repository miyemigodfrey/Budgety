"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Link } from "react-router-dom";
import {
	ArrowLeft,
	CalendarDays,
	KeyRound,
	Lock,
	LogOut,
	Mail,
	Pencil,
	ShieldCheck,
	Trash2,
	User,
} from "lucide-react";
import UniversalModal from "@/components/ui/modal";
import SetPinModal from "./SetPinModal";
import { getMe, updateName, removePin, type Me } from "@/api/account";
import {
	getSettings,
	updateSettings,
	type UserSettings,
} from "@/api/settings";
import { formatDate } from "@/lib/formatDate";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

export default function ProfilePage() {
	const [me, setMe] = useState<Me | null>(null);
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [nameDraft, setNameDraft] = useState("");
	const [savingName, setSavingName] = useState(false);
	const [pinOpen, setPinOpen] = useState(false);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [removing, setRemoving] = useState(false);
	// True when the Set-PIN flow was triggered by turning App Lock on.
	const [enableLockAfterPin, setEnableLockAfterPin] = useState(false);

	const load = useCallback(async () => {
		const [meData, settingsData] = await Promise.all([getMe(), getSettings()]);
		setMe(meData);
		setSettings(settingsData);
		return meData;
	}, []);

	useEffect(() => {
		load()
			.then((meData) => setNameDraft(meData.name ?? ""))
			.catch((e) => toast.error(getErrorMessage(e, "Couldn't load your profile.")));
	}, [load]);

	const logout = () => signOut({ callbackUrl: "/login" });

	const savedName = me?.name ?? "";
	const nameUnchanged = nameDraft.trim() === savedName.trim();

	const handleSaveName = async () => {
		const name = nameDraft.trim();
		if (name.length < 2) {
			toast.error("Name must be at least 2 characters.");
			return;
		}
		setSavingName(true);
		try {
			await updateName(name);
			setMe((prev) => (prev ? { ...prev, name } : prev));
			setNameDraft(name);
			toast.success("Name updated");
		} catch (e) {
			toast.error(getErrorMessage(e, "Couldn't update your name."));
		} finally {
			setSavingName(false);
		}
	};

	const handleToggleLock = async (value: boolean) => {
		if (!me || !settings) return;
		// Can't lock without a PIN — set one first, then enable on success.
		if (value && !me.hasPin) {
			setEnableLockAfterPin(true);
			setPinOpen(true);
			return;
		}
		const previous = settings.appLockEnabled;
		setSettings({ ...settings, appLockEnabled: value });
		try {
			await updateSettings({ appLockEnabled: value });
		} catch (e) {
			setSettings({ ...settings, appLockEnabled: previous });
			toast.error(getErrorMessage(e, "Couldn't update App Lock."));
		}
	};

	const handlePinSaved = async () => {
		try {
			if (enableLockAfterPin) {
				await updateSettings({ appLockEnabled: true });
			}
		} catch (e) {
			toast.error(getErrorMessage(e, "Saved PIN, but couldn't enable App Lock."));
		} finally {
			setEnableLockAfterPin(false);
			await load().catch(() => {});
		}
	};

	const handleRemovePin = async () => {
		setRemoving(true);
		try {
			await removePin();
			toast.success("PIN removed");
			setRemoveOpen(false);
			await load();
		} catch (e) {
			toast.error(getErrorMessage(e, "Couldn't remove the PIN."));
		} finally {
			setRemoving(false);
		}
	};

	const initial = me?.name?.trim()?.[0]?.toUpperCase() ?? "?";
	const lockOn = !!settings?.appLockEnabled;
	const pinStatus = !me
		? null
		: me.hasPin
			? `A PIN is set · App Lock is ${lockOn ? "on" : "off"}`
			: "No PIN yet · set one to use App Lock";

	return (
		<main className="page page-narrow">
			<div className="page-h">
				<div className="page-h-text">
					<Link to="/setting" className="back">
						<ArrowLeft className="ic ic-sm" />
						Settings
					</Link>
					<h1 className="t-h1">Profile</h1>
					<p className="t-muted">Your details and how you unlock Budgety.</p>
				</div>
			</div>

			{/* Identity */}
			<section className="card row-f" style={{ gap: 18 }} aria-label="Account">
				{me ? (
					<span className="avatar avatar-xl" aria-hidden="true">
						{initial}
					</span>
				) : (
					<span className="sk" style={{ width: 88, height: 88, borderRadius: 999, flex: "none" }} />
				)}
				<div className="grow stack-sm" style={{ gap: 4 }}>
					{me ? (
						<>
							<h2 className="t-h2 trunc">{me.name}</h2>
							<span className="row-f t-sm t-muted" style={{ gap: 6 }}>
								<Mail className="ic ic-sm" />
								<span className="trunc">{me.email}</span>
							</span>
							<span className="row-f t-sm t-muted" style={{ gap: 6 }}>
								<CalendarDays className="ic ic-sm" />
								Member since {formatDate(me.createdAt)}
							</span>
						</>
					) : (
						<>
							<span className="sk" style={{ height: 24, width: 180 }} />
							<span className="sk" style={{ height: 14, width: 220 }} />
							<span className="sk" style={{ height: 14, width: 160 }} />
						</>
					)}
				</div>
			</section>

			{/* Personal details (edit name) */}
			<section className="card card-flush" aria-label="Personal details">
				<div className="card-h">
					<div>
						<p className="card-t">Personal details</p>
						<p className="card-s">This is the name Budgety greets you with.</p>
					</div>
				</div>
				<div className="stack" style={{ padding: "8px 20px 20px", gap: 16 }}>
					<div className="field">
						<label className="label" htmlFor="pf-name">
							Name
						</label>
						<div className="control">
							<User className="ic" />
							<input
								id="pf-name"
								className="input has-ic"
								value={nameDraft}
								disabled={!me}
								onChange={(e) => setNameDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !nameUnchanged && !savingName)
										void handleSaveName();
								}}
								autoComplete="name"
								aria-describedby="pf-name-hint"
							/>
						</div>
						<span className="hint" id="pf-name-hint">
							At least 2 characters.
						</span>
					</div>
					<div className="field">
						<label className="label" htmlFor="pf-email">
							Email
						</label>
						<div className="control">
							<Mail className="ic" />
							<input
								id="pf-email"
								className="input has-ic"
								value={me?.email ?? ""}
								readOnly
								aria-describedby="pf-email-hint"
								style={{ background: "var(--surface-2)", color: "var(--muted-ink)" }}
							/>
						</div>
						<span className="hint" id="pf-email-hint">
							Your sign-in email can&rsquo;t be changed here.
						</span>
					</div>
				</div>
				<div className="card-foot" style={{ justifyContent: "flex-end" }}>
					<button
						className="btn btn-ghost"
						type="button"
						disabled={nameUnchanged || savingName}
						onClick={() => setNameDraft(savedName)}>
						Cancel
					</button>
					<button
						className="btn btn-primary"
						type="button"
						disabled={!me || nameUnchanged || savingName}
						onClick={handleSaveName}>
						{savingName ? "Saving…" : "Save name"}
					</button>
				</div>
			</section>

			{/* Security */}
			<section className="card card-flush" aria-label="Security">
				<div className="card-h">
					<div>
						<p className="card-t">Security</p>
						<p className="card-s">A convenience lock on top of your signed-in session.</p>
					</div>
				</div>
				<div className="list">
					<div className="li">
						<span className="ic-tile">
							<Lock className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t" id="pf-lock-label">
								App Lock (PIN)
							</span>
							<span className="li-s">
								Unlock with a 4-digit PIN instead of your password each time.
							</span>
						</span>
						{settings && me ? (
							<button
								type="button"
								role="switch"
								aria-checked={lockOn}
								aria-labelledby="pf-lock-label"
								className={"switch" + (lockOn ? " on" : "")}
								onClick={() => void handleToggleLock(!lockOn)}
							/>
						) : (
							<span className="sk" style={{ width: 44, height: 26, borderRadius: 999 }} />
						)}
					</div>
					<div className="li" style={{ flexWrap: "wrap" }}>
						<span className="ic-tile neutral">
							<ShieldCheck className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t">PIN</span>
							<span className="li-s">
								{pinStatus ?? <span className="sk" style={{ height: 12, width: 160 }} />}
							</span>
						</span>
						<div className="row-f" style={{ gap: 8 }}>
							<button
								className="btn btn-secondary btn-sm"
								type="button"
								disabled={!me}
								onClick={() => {
									setEnableLockAfterPin(false);
									setPinOpen(true);
								}}>
								{me?.hasPin ? (
									<Pencil className="ic ic-sm" />
								) : (
									<KeyRound className="ic ic-sm" />
								)}
								{me?.hasPin ? "Change PIN" : "Set PIN"}
							</button>
							{me?.hasPin && (
								<button
									className="btn btn-danger btn-sm"
									type="button"
									onClick={() => setRemoveOpen(true)}>
									Remove PIN
								</button>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Log out */}
			<section className="card between wrap" aria-label="Log out">
				<div className="stack-sm" style={{ gap: 2 }}>
					<p className="card-t">Log out</p>
					<p className="t-sm t-muted">Sign out of Budgety on this device.</p>
				</div>
				<button className="btn btn-danger" type="button" onClick={logout}>
					<LogOut className="ic ic-sm" />
					Log out
				</button>
			</section>

			{/* Remove PIN */}
			<UniversalModal
				open={removeOpen}
				onOpenChange={setRemoveOpen}
				title="Remove your PIN?"
				footer={
					<>
						<span className="grow hide-m" />
						<button
							className="btn btn-ghost"
							type="button"
							disabled={removing}
							onClick={() => setRemoveOpen(false)}>
							Cancel
						</button>
						<button
							className="btn btn-danger"
							type="button"
							disabled={removing}
							onClick={handleRemovePin}>
							<Trash2 className="ic ic-sm" />
							{removing ? "Removing…" : "Remove PIN"}
						</button>
					</>
				}>
				<p className="t-sm t-muted">
					App Lock will be turned off too. You can set a new PIN any time.
				</p>
			</UniversalModal>

			<SetPinModal open={pinOpen} setOpen={setPinOpen} onSaved={handlePinSaved} />
		</main>
	);
}

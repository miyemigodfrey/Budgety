"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { KeyRound, LogOut, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
	const [nameOpen, setNameOpen] = useState(false);
	const [nameDraft, setNameDraft] = useState("");
	const [savingName, setSavingName] = useState(false);
	const [pinOpen, setPinOpen] = useState(false);
	// True when the Set-PIN flow was triggered by turning App Lock on.
	const [enableLockAfterPin, setEnableLockAfterPin] = useState(false);

	const load = useCallback(async () => {
		const [meData, settingsData] = await Promise.all([getMe(), getSettings()]);
		setMe(meData);
		setSettings(settingsData);
	}, []);

	useEffect(() => {
		load().catch((e) =>
			toast.error(getErrorMessage(e, "Couldn't load your profile.")),
		);
	}, [load]);

	const logout = () => signOut({ callbackUrl: "/login" });

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
			setNameOpen(false);
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
		if (!window.confirm("Remove your PIN and turn App Lock off?")) return;
		try {
			await removePin();
			toast.success("PIN removed");
			await load();
		} catch (e) {
			toast.error(getErrorMessage(e, "Couldn't remove the PIN."));
		}
	};

	const initial = me?.name?.trim()?.[0]?.toUpperCase() ?? "?";

	return (
		<div className="w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-2xl">
				<div className="flex items-center gap-2">
					<BackButton />
					<h1 className="font-bold text-2xl">Profile</h1>
				</div>
			</header>

			<div className="mt-8 w-full max-w-2xl space-y-4">
				{/* Identity card */}
				<div className="bg-card w-full rounded-xl p-5 shadow-md">
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-brand-foreground">
							{me ? initial : <Skeleton className="h-16 w-16 rounded-full" />}
						</div>
						<div className="min-w-0 flex-1">
							{me ? (
								<>
									<p className="truncate text-lg font-semibold text-foreground">
										{me.name}
									</p>
									<p className="truncate text-sm text-muted-foreground">
										{me.email}
									</p>
								</>
							) : (
								<div className="space-y-2">
									<Skeleton className="h-5 w-40" />
									<Skeleton className="h-4 w-52" />
								</div>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							className="shrink-0"
							disabled={!me}
							aria-label="Edit name"
							onClick={() => {
								setNameDraft(me?.name ?? "");
								setNameOpen(true);
							}}>
							<Pencil className="size-4" />
						</Button>
					</div>
					{me && (
						<p className="mt-3 text-xs text-muted-foreground">
							Member since {formatDate(me.createdAt)}
						</p>
					)}
				</div>

				{/* Security */}
				<div className="bg-card w-full rounded-xl p-5 shadow-md space-y-4">
					<div className="flex items-center gap-2">
						<ShieldCheck className="size-5 text-brand" />
						<h2 className="font-semibold text-foreground">Security</h2>
					</div>

					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium text-foreground">
								App Lock (PIN)
							</p>
							<p className="text-xs text-muted-foreground">
								Unlock with a 4-digit PIN instead of your password each time.
							</p>
						</div>
						{settings && me ? (
							<Switch
								checked={settings.appLockEnabled}
								onCheckedChange={handleToggleLock}
							/>
						) : (
							<Skeleton className="h-5 w-9 rounded-full" />
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
						<Button
							variant="outline"
							size="sm"
							disabled={!me}
							onClick={() => {
								setEnableLockAfterPin(false);
								setPinOpen(true);
							}}>
							<KeyRound className="size-4" />
							{me?.hasPin ? "Change PIN" : "Set PIN"}
						</Button>
						{me?.hasPin && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleRemovePin}
								className="text-danger hover:text-danger">
								<Trash2 className="size-4" />
								Remove PIN
							</Button>
						)}
					</div>
				</div>

				{/* Log out */}
				<div className="bg-card w-full flex items-center justify-between rounded-xl p-5 shadow-md">
					<p className="text-sm font-semibold text-foreground">Log Out</p>
					<Button
						type="button"
						onClick={logout}
						variant="outline"
						className="text-danger hover:text-danger">
						<LogOut className="size-4" />
						Log out
					</Button>
				</div>
			</div>

			{/* Edit name */}
			<UniversalModal
				open={nameOpen}
				onOpenChange={setNameOpen}
				title="Edit name"
				footer={
					<div className="flex w-full flex-col gap-3">
						<Button
							className="bg-brand"
							disabled={savingName}
							onClick={handleSaveName}>
							{savingName ? "Saving…" : "Save"}
						</Button>
						<Button variant="ghost" onClick={() => setNameOpen(false)}>
							Cancel
						</Button>
					</div>
				}>
				<div className="w-full space-y-2">
					<label htmlFor="name" className="text-sm font-medium">
						Name
					</label>
					<Input
						id="name"
						value={nameDraft}
						onChange={(e) => setNameDraft(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
						autoFocus
					/>
				</div>
			</UniversalModal>

			<SetPinModal open={pinOpen} setOpen={setPinOpen} onSaved={handlePinSaved} />
		</div>
	);
}

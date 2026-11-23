"use client";

import {
	Bell,
	ChevronRight,
	Database,
	Download,
	Layers,
	Lock,
	LogOut,
	Moon,
	Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { signOut } from "next-auth/react";
import { useTheme } from "@/hooks/useTheme";
import { useSpace } from "@/hooks/useSpace";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";
import { getMe, type Me } from "@/api/account";
import { enablePush, disablePush } from "@/lib/pushClient";
import {
	getSettings,
	updateSettings,
	type UserSettings,
	type UpdateSettingsDto,
} from "@/api/settings";
import { version } from "../../../package.json";

type ToggleKey = Exclude<keyof UpdateSettingsDto, "darkMode" | "appLockEnabled">;

/** Canvas switch: a real button with role="switch". */
function Toggle({
	on,
	labelId,
	disabled,
	onChange,
}: {
	on: boolean;
	labelId: string;
	disabled?: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={on}
			aria-labelledby={labelId}
			disabled={disabled}
			className={"switch" + (on ? " on" : "")}
			style={disabled ? { opacity: 0.6, cursor: "progress" } : undefined}
			onClick={() => onChange(!on)}
		/>
	);
}

const SwitchSkeleton = () => (
	<span className="sk" style={{ width: 44, height: 26, borderRadius: 999, flex: "none" }} />
);

export default function SettingPage() {
	const logout = () => signOut({ callbackUrl: "/login" });
	const { theme, setTheme } = useTheme();
	const { spaces } = useSpace();
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [me, setMe] = useState<Me | null>(null);
	const [pending, setPending] = useState<ToggleKey | "darkMode" | null>(null);

	useEffect(() => {
		getSettings()
			.then(setSettings)
			.catch((error) => {
				console.error("Failed to load settings:", error);
				toast.error(getErrorMessage(error, "Couldn't load your settings."));
			});
		getMe()
			.then(setMe)
			.catch((error) => console.error("Failed to load profile:", error));
	}, []);

	const handleToggle = async (key: ToggleKey, value: boolean) => {
		if (!settings) return;
		setPending(key);
		try {
			// Reminders need a push subscription (and notification permission)
			// before we persist the flag — if the user declines, leave it off.
			if (key === "dailyReminder") {
				if (value) {
					const res = await enablePush();
					if (!res.ok) {
						toast.error(res.reason ?? "Couldn't enable reminders.");
						return;
					}
				} else {
					await disablePush();
				}
			}

			// Optimistic update, rolled back on failure.
			const previous = settings;
			setSettings({ ...settings, [key]: value });
			try {
				const updated = await updateSettings({ [key]: value });
				setSettings(updated);
			} catch (error) {
				console.error("Failed to update settings:", error);
				setSettings(previous);
				if (key === "dailyReminder" && value) await disablePush();
				toast.error("Failed to update setting. Please try again.");
			}
		} finally {
			setPending(null);
		}
	};

	// Theme application is owned by ThemeProvider: we only tell it the new value
	// (never touch classList here) and persist it so other devices follow.
	const handleTheme = async (dark: boolean) => {
		const previous = theme;
		setTheme(dark ? "dark" : "light");
		if (settings) setSettings({ ...settings, darkMode: dark });
		setPending("darkMode");
		try {
			const updated = await updateSettings({ darkMode: dark });
			setSettings(updated);
		} catch (error) {
			console.error("Failed to update settings:", error);
			setTheme(previous);
			if (settings) setSettings({ ...settings, darkMode: previous === "dark" });
			toast.error("Failed to update setting. Please try again.");
		} finally {
			setPending(null);
		}
	};

	const initial = me?.name?.trim()?.[0]?.toUpperCase() ?? "?";
	const spaceNames = spaces.map((s) => s.name).join(", ");

	return (
		<main className="page page-narrow">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">Account</p>
					<h1 className="t-h1">Settings</h1>
					<p className="t-muted">
						Your profile, preferences and how Budgety keeps your data.
					</p>
				</div>
			</div>

			{/* Profile */}
			<Link
				to="/profile"
				className="card row-f"
				style={{ gap: 16 }}
				aria-label="Open profile">
				{me ? (
					<span className="avatar avatar-lg" aria-hidden="true">
						{initial}
					</span>
				) : (
					<span className="sk" style={{ width: 64, height: 64, borderRadius: 999, flex: "none" }} />
				)}
				<span className="grow stack-sm" style={{ gap: 2 }}>
					{me ? (
						<>
							<strong className="t-h3 trunc" style={{ fontSize: 17 }}>
								{me.name}
							</strong>
							<span className="t-sm t-muted trunc">{me.email}</span>
						</>
					) : (
						<>
							<span className="sk" style={{ height: 18, width: 160 }} />
							<span className="sk" style={{ height: 14, width: 200 }} />
						</>
					)}
				</span>
				<span className="card-link">
					<span className="hide-m">View profile</span>
					<ChevronRight className="ic ic-sm" />
				</span>
			</Link>

			{/* Money */}
			<section className="stack-sm" aria-labelledby="set-money">
				<h2 className="t-over" id="set-money" style={{ padding: "0 4px" }}>
					Money
				</h2>
				<div className="card card-flush list">
					<Link to="/setting/sources" className="li">
						<span className="ic-tile">
							<Wallet className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t">Manage sources</span>
							<span className="li-s">Rename, edit balances or remove a source</span>
						</span>
						<ChevronRight className="ic ic-sm t-muted" />
					</Link>
					<Link to="/spaces" className="li">
						<span className="ic-tile">
							<Layers className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t">Spaces</span>
							<span className="li-s">
								<span className="trunc">
									{spaceNames || "Keep money separate by purpose"}
								</span>
							</span>
						</span>
						<ChevronRight className="ic ic-sm t-muted" />
					</Link>
				</div>
			</section>

			{/* Preferences */}
			<section className="stack-sm" aria-labelledby="set-prefs">
				<h2 className="t-over" id="set-prefs" style={{ padding: "0 4px" }}>
					Preferences
				</h2>
				<div className="card card-flush list">
					<div className="li">
						<span className="ic-tile neutral">
							<Bell className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t" id="set-reminder">
								Daily reminder
							</span>
							<span className="li-s">
								A nudge each evening to log the day&rsquo;s spending
							</span>
						</span>
						{settings ? (
							<Toggle
								on={settings.dailyReminder}
								labelId="set-reminder"
								disabled={pending === "dailyReminder"}
								onChange={(v) => void handleToggle("dailyReminder", v)}
							/>
						) : (
							<SwitchSkeleton />
						)}
					</div>
					<div className="li">
						<span className="ic-tile neutral">
							<Moon className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t" id="set-dark">
								Dark mode
							</span>
							<span className="li-s">Easier on the eyes at night</span>
						</span>
						<Toggle
							on={theme === "dark"}
							labelId="set-dark"
							disabled={pending === "darkMode"}
							onChange={(v) => void handleTheme(v)}
						/>
					</div>
				</div>
			</section>

			{/* Security */}
			<section className="stack-sm" aria-labelledby="set-security">
				<h2 className="t-over" id="set-security" style={{ padding: "0 4px" }}>
					Security
				</h2>
				<div className="card card-flush list">
					<Link to="/profile" className="li">
						<span className="ic-tile neutral">
							<Lock className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t">App lock (PIN)</span>
							<span className="li-s">
								Unlock with a 4-digit PIN · set it up on your profile
							</span>
						</span>
						{settings &&
							(settings.appLockEnabled ? (
								<span className="badge in hide-m">On</span>
							) : (
								<span className="badge outline hide-m">Off</span>
							))}
						<ChevronRight className="ic ic-sm t-muted" />
					</Link>
				</div>
			</section>

			{/* Data */}
			<section className="stack-sm" aria-labelledby="set-data">
				<h2 className="t-over" id="set-data" style={{ padding: "0 4px" }}>
					Data
				</h2>
				<div className="card card-flush list">
					<div className="li">
						<span className="ic-tile neutral">
							<Database className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t" id="set-backup">
								Backup &amp; restore
							</span>
							<span className="li-s">
								Keep a copy of your records you can restore later
							</span>
						</span>
						{settings ? (
							<Toggle
								on={settings.backupEnabled}
								labelId="set-backup"
								disabled={pending === "backupEnabled"}
								onChange={(v) => void handleToggle("backupEnabled", v)}
							/>
						) : (
							<SwitchSkeleton />
						)}
					</div>
					<Link to="/report" className="li">
						<span className="ic-tile neutral">
							<Download className="ic" />
						</span>
						<span className="li-main">
							<span className="li-t">Export data</span>
							<span className="li-s">CSV or PDF, from Reports</span>
						</span>
						<ChevronRight className="ic ic-sm t-muted" />
					</Link>
				</div>
			</section>

			<button className="btn btn-danger btn-lg btn-block" type="button" onClick={logout}>
				<LogOut className="ic ic-sm" />
				Log out
			</button>
			<p className="t-xs t-muted t-center">Budgety · version {version}</p>
		</main>
	);
}

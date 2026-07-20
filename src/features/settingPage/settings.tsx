"use client";

import {
	Settings,
	SunMoon,
	FileText,
	LockKeyhole,
	CalendarSync,
	ChevronRight,
	LogOut,
	UserX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "next-auth/react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";
import {
	getSettings,
	updateSettings,
	type UserSettings,
	type UpdateSettingsDto,
} from "@/api/settings";

type ToggleKey = keyof UpdateSettingsDto;

export default function SettingPage() {
	const logout = () => signOut({ callbackUrl: "/login" });
	const { setTheme } = useTheme();
	const [settings, setSettings] = useState<UserSettings | null>(null);

	useEffect(() => {
		getSettings()
			.then(setSettings)
			.catch((error) => {
				console.error("Failed to load settings:", error);
				toast.error(getErrorMessage(error, "Couldn't load your settings."));
			});
	}, []);

	const handleToggle = async (key: ToggleKey, value: boolean) => {
		if (!settings) return;

		// Optimistic update. Theme application is owned by ThemeProvider, so we
		// only tell it the new value — we never touch classList here.
		const previous = settings;
		setSettings({ ...settings, [key]: value });
		if (key === "darkMode") {
			setTheme(value ? "dark" : "light");
		}

		try {
			const updated = await updateSettings({ [key]: value });
			setSettings(updated);
		} catch (error) {
			console.error("Failed to update settings:", error);
			// Roll back on failure
			setSettings(previous);
			if (key === "darkMode") {
				setTheme(previous.darkMode ? "dark" : "light");
			}
			toast.error("Failed to update setting. Please try again.");
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<h1 className="font-bold text-2xl">Settings</h1>
			</header>

			<div className=" w-full flex flex-col items-start gap-4 mt-8">
				<div className="bg-card w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<FileText className="size-4.5 text-brand" />
						<p className="text-sm font-semibold text-foreground">
							Manage Sources
						</p>
					</div>
					<Link to="/setting/sources" aria-label="Manage sources">
						<ChevronRight />
					</Link>
				</div>

				<div className="bg-card w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<CalendarSync className="size-4.5 text-brand" />
						<p className="text-sm font-semibold text-foreground">
							Daily Reminder
						</p>
					</div>
					{settings ? (
						<Switch
							checked={settings.dailyReminder}
							onCheckedChange={(value) => handleToggle("dailyReminder", value)}
						/>
					) : (
						<Skeleton className="h-5 w-9 rounded-full" />
					)}
				</div>

				<div className="bg-card w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<LockKeyhole className="size-4.5 text-brand" />
						<p className="text-sm font-semibold text-foreground">
							App Lock (PIN)
						</p>
					</div>
					{settings ? (
						<Switch
							checked={settings.appLockEnabled}
							onCheckedChange={(value) => handleToggle("appLockEnabled", value)}
						/>
					) : (
						<Skeleton className="h-5 w-9 rounded-full" />
					)}
				</div>

				<div className="bg-card w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<SunMoon className="size-4.5 text-brand" />
						<p className="text-sm font-semibold text-foreground">Dark Mode</p>
					</div>
					{settings ? (
						<Switch
							checked={settings.darkMode}
							onCheckedChange={(value) => handleToggle("darkMode", value)}
						/>
					) : (
						<Skeleton className="h-5 w-9 rounded-full" />
					)}
				</div>

				<div className="bg-card w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<Settings className="size-4.5 text-brand" />
						<p className="text-sm font-semibold text-foreground">
							Backup & Restore
						</p>
					</div>
					{settings ? (
						<Switch
							checked={settings.backupEnabled}
							onCheckedChange={(value) => handleToggle("backupEnabled", value)}
						/>
					) : (
						<Skeleton className="h-5 w-9 rounded-full" />
					)}
				</div>

				<div className="bg-card w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<UserX className="size-4.5 text-brand" />
						<p className="text-sm font-semibold text-foreground">Log Out</p>
					</div>
					<Button
						type="button"
						onClick={logout}
						variant={"outline"}
						aria-label="Log out"
						className="rounded-lg border-border drop-shadow-xl">
						<LogOut className="size-4.5 text-muted-foreground" />
					</Button>
				</div>
			</div>
		</div>
	);
}
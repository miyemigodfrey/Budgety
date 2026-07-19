import api from "./axios";

export type UserSettings = {
	userId: string;
	dailyReminder: boolean;
	appLockEnabled: boolean;
	darkMode: boolean;
	backupEnabled: boolean;
	updatedAt: string;
};

export type UpdateSettingsDto = Partial<
	Pick<
		UserSettings,
		"dailyReminder" | "appLockEnabled" | "darkMode" | "backupEnabled"
	>
>;

export const getSettings = async (): Promise<UserSettings> => {
	const res = await api.get("/settings");
	return res.data;
};

export const updateSettings = async (
	data: UpdateSettingsDto,
): Promise<UserSettings> => {
	const res = await api.patch("/settings", data);
	return res.data;
};

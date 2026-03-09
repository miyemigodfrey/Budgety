import {
	Settings,
	SunMoon,
	FileText,
	LockKeyhole,
	CalendarSync,
	ChevronRight,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingPage() {
	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<h1 className="font-bold text-2xl">Settings</h1>
			</header>

			<div className=" w-full flex flex-col items-start gap-4 mt-8">
				<div className="bg-white w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<FileText className="size-4.5 text-blue-800" />
						<p className="text-sm font-semibold text-gray-900">
							Manage Sources
						</p>
					</div>
					<ChevronRight />
				</div>

				<div className="bg-white w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<CalendarSync className="size-4.5 text-blue-800" />
						<p className="text-sm font-semibold text-gray-900">
							Daily Reminder
						</p>
					</div>
					<Switch />
				</div>

				<div className="bg-white w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<LockKeyhole className="size-4.5 text-blue-800" />
						<p className="text-sm font-semibold text-gray-900">
							App Lock (PIN)
						</p>
					</div>
					<Switch />
				</div>

				<div className="bg-white w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<SunMoon className="size-4.5 text-blue-800" />
						<p className="text-sm font-semibold text-gray-900">Dark Mode</p>
					</div>
					<Switch />
				</div>

				<div className="bg-white w-full flex items-center justify-between rounded-xl pt-4.5 pb-2 px-1.5 space-y-2 shadow-xl ">
					<div className="flex items-center space-x-2">
						<Settings className="size-4.5 text-blue-800" />
						<p className="text-sm font-semibold text-gray-900">
							Backup & Restore
						</p>
					</div>
					<ChevronRight className="size-4.5 text-gray-500" />
				</div>
			</div>
		</div>
	);
}

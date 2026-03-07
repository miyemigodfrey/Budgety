import { ChevronRight, Edit, Settings, User, Wallet } from "lucide-react";

export default function SourcePage() {
	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<div className="flex items-center justify-between p-2">
					<h1 className="font-bold text-2xl">Report</h1>
					<Settings className="text-gray-500 size-6" />
				</div>
			</header>

			{/**Source List populated based on the user's sources in modal */}
			<ul className=" w-full">
				<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
					<div className=" flex items-center justify-between py-1">
						<div className="flex items-center space-x-2">
							<Wallet className="text-green-700 size-4.5" />
							<p className="font-semibold">Salary</p>
						</div>

						<p className="text-lg md:text-xl text-gray-700 font-semibold">
							{/**remaining balance */} £2369
						</p>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
							<span className="text-gray-500 text-xs md:text-sm py-3">
								{/**initial Amount */} Initial Amount | £40,000
							</span>
							<Edit className="size-4 text-gray-500" />
						</div>

						{/**LINK TO GO SOURCE DETAILS */}
						<ChevronRight className="text-gray-500 size-4.5" />
					</div>
				</li>

				<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
					<div className=" flex items-center justify-between py-1">
						<div className="flex items-center space-x-2">
							<Edit className="text-green-700 size-4.5" />
							<p className="font-semibold">Opay</p>
						</div>
						<p className="text-lg md:text-xl text-gray-700 font-semibold">
							{/**remaining balance */} £12,009
						</p>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
							<span className="text-gray-500 text-xs md:text-sm py-3">
								{/**initial Amount */} Initial Amount | £60,000
							</span>
							<Edit className="size-4 text-gray-500" />
						</div>

						{/**LINK TO GO SOURCE DETAILS */}
						<ChevronRight className="text-gray-500 size-4.5" />
					</div>
				</li>

				<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
					<div className=" flex items-center justify-between py-1">
						<div className="flex items-center space-x-2">
							<User className="text-green-700 size-4.5" />
							<p className="font-semibold">Access</p>
						</div>
						<p className="text-lg md:text-xl text-gray-700 font-semibold">
							{/**remaining balance */} £4069
						</p>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
							<span className="text-gray-500 text-xs md:text-sm py-3">
								{/**initial Amount */} Initial Amount | £30,000
							</span>
							<Edit className="size-4 text-gray-500" />
						</div>

						{/**LINK TO GO SOURCE DETAILS */}
						<ChevronRight className="text-gray-500 size-4.5" />
					</div>
				</li>
			</ul>
		</div>
	);
}

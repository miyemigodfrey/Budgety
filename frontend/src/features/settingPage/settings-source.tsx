import { Clock, Edit, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { deleteSource, getSources, type SourceId } from "@/api/sources";
import { toast } from "react-toastify";
import EditSourceModal from "../addsource/EditSourceModal";
import AddSourceModal from "../addsource/sourceModal";

export default function ManageSourcePage() {
	const [source, setSource] = useState<SourceId[]>([]);
	const [loading, setLoading] = useState(true);

	const [addOpen, setAddOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedSource, setSelectedSource] = useState<SourceId | null>(null);

	useEffect(() => {
		const fetchSources = async () => {
			try {
				setLoading(true);
				const data = await getSources();
				setSource(data as SourceId[]);
			} catch (error) {
				console.error("Failed to fetch sources:", error);
				toast.error("Failed to load sources");
			} finally {
				setLoading(false);
			}
		};
		fetchSources();
	}, []);

	const handleDelete = async (id: string) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this source?",
		);

		if (!confirmDelete) return;

		try {
			await deleteSource(id);
			setSource((prev) => prev.filter((item) => item.id !== id));

			toast.warning("Source deleted successfully");
		} catch (error) {
			toast.error("Failed to delete source");
			throw error;
		}
	};

	const handleEditClick = (source: SourceId) => {
		setSelectedSource(source);
		setEditOpen(true);
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<div className="flex flex-col space-y-1 p-2">
					<h1 className="font-bold text-2xl">Manage Your Source</h1>
					<p className="text-sm text-gray-500">
						Manage and monitor your connected data sources
					</p>
				</div>
			</header>

			{loading ? (
				<p>Loading...</p>
			) : (
				<div className=" w-full flex flex-col lg:flex-row items-start gap-4 mt-8">
					<div className=" w-full">
						{source.map((source) => (
							<ul key={source.id} className=" w-full">
								<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
									<div className=" flex items-center justify-between py-2">
										<div className="flex items-center space-x-2">
											<Wallet className="text-green-700 size-4.5" />
											<p className="font-semibold">{source.name}</p>
										</div>

										<div className="flex items-center justify-center gap-1 bg-green-300/50 px-2 py-1 rounded-md">
											<div className="bg-green-600 size-1.5 rounded-full"></div>
											<p className="text-sm md:text-md text-green-700 font-semibold">
												Active
											</p>
										</div>
									</div>

									<div className="pt-2 flex flex-col md:flex-row justify-between gap-2">
										<div className="flex items-center gap-2">
											<Clock className="size-4 text-gray-500" />
											<span className="text-sm font-semibold text-gray-500">
												5 Hours Ago
											</span>
										</div>
										<div className="flex items-start justify-end gap-2 pt-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditClick(source)}
												className="p-1 border border-gray-300 hover:bg-gray-100">
												<Edit className="size-4 text-gray-500" />
												Edit
											</Button>
											<Button
												variant="ghost"
												onClick={() => handleDelete(source.id)}
												size="sm"
												className="p-1 border text-red-600 border-red-300 hover:bg-gray-100">
												<Trash2 className="size-4 text-red-600" />
												Delete
											</Button>
										</div>
									</div>
								</li>
							</ul>
						))}

						<div className="flex items-center justify-between gap-2 mt-4">
							<Button
								onClick={() => setAddOpen(true)}
								variant="outline"
								className="border-gray-300 shadow-xl py-5 px-10 hover:bg-green-700/70 hover:text-gray-200 hover:border-green-700 ">
								Add Source
							</Button>
						</div>
					</div>
				</div>
			)}

			<AddSourceModal
				open={addOpen}
				setOpen={setAddOpen}
				onCreated={(newSource) => {
					setSource((prev) => [newSource, ...prev]);
				}}
			/>

			{selectedSource && (
				<EditSourceModal
					open={editOpen}
					setOpen={setEditOpen}
					source={selectedSource}
					onUpdated={(updatedSource) => {
						setSource((prev) =>
							prev.map((item) =>
								item.id === updatedSource.id ? updatedSource : item,
							),
						);
					}}
				/>
			)}
		</div>
	);
}

"use client";

import { Clock, Edit, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { deleteSource, getSources, type Source } from "@/api/sources";
import { toast } from "react-toastify";
import EditSourceModal from "../addsource/EditSourceModal";
import AddSourceModal from "../addsource/sourceModal";
import { formatDate } from "@/lib/formatDate";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageSourcePage() {
	const [source, setSource] = useState<Source[]>([]);
	const [loading, setLoading] = useState(true);

	const [addOpen, setAddOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedSource, setSelectedSource] = useState<Source | null>(null);

	useEffect(() => {
		const fetchSources = async () => {
			try {
				setLoading(true);
				const data = await getSources();
				setSource(data);
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

	const handleEditClick = (source: Source) => {
		setSelectedSource(source);
		setEditOpen(true);
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<div className="flex flex-col space-y-1 p-2">
					<h1 className="font-bold text-2xl">Manage Your Source</h1>
					<p className="text-sm text-muted-foreground">
						Manage and monitor your connected data sources
					</p>
				</div>
			</header>

			{loading ? (
				<div className="w-full mt-8 space-y-2.5">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="w-full h-28 rounded-xl" />
					))}
				</div>
			) : source.length === 0 ? (
				<div className="w-full mt-8">
					<EmptyState
						icon={Wallet}
						title="No sources to manage"
						description="Once you add a money source it'll appear here for editing."
						action={
							<Button onClick={() => setAddOpen(true)} variant="primary">
								Add a source
							</Button>
						}
					/>
				</div>
			) : (
				<div className=" w-full flex flex-col lg:flex-row items-start gap-4 mt-8">
					<div className=" w-full">
						<ul className="w-full">
							{source.map((source) => (
								<li
									key={source.id}
									className="mt-2.5 w-full bg-card rounded-xl shadow-md p-3 border border-border divide-y divide-border">
									<div className=" flex items-center justify-between py-2">
										<div className="flex items-center space-x-2">
											<Wallet className="text-success size-4.5" />
											<p className="font-semibold">{source.name}</p>
										</div>

										<div className="flex items-center justify-center gap-1 bg-success-surface px-2 py-1 rounded-md">
											<div className="bg-success size-1.5 rounded-full"></div>
											<p className="text-sm md:text-md text-success font-semibold">
												Active
											</p>
										</div>
									</div>

									<div className="pt-2 flex flex-col md:flex-row justify-between gap-2">
										<div className="flex items-center gap-2">
											<Clock className="size-4 text-muted-foreground" />
											<span className="text-sm font-semibold text-muted-foreground">
												Updated {formatDate(source.updatedAt)}
											</span>
										</div>
										<div className="flex items-start justify-end gap-2 pt-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditClick(source)}
												className="p-1 border border-border hover:bg-muted">
												<Edit className="size-4 text-muted-foreground" />
												Edit
											</Button>
											<Button
												variant="ghost"
												onClick={() => handleDelete(source.id)}
												size="sm"
												className="p-1 border text-danger border-danger/50 hover:bg-muted">
												<Trash2 className="size-4 text-danger" />
												Delete
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>

						<div className="flex items-center justify-between gap-2 mt-4">
							<Button
								onClick={() => setAddOpen(true)}
								variant="outline"
								className="border-border shadow-xl py-5 px-10 hover:bg-success/70 hover:text-brand-foreground hover:border-success ">
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
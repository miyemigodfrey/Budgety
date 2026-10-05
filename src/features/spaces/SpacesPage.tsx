"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Check,
	Layers,
	Pencil,
	Plus,
	Trash2,
	Eye,
	Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useSpace } from "@/hooks/useSpace";
import {
	createSpace,
	deleteSpace,
	renameSpace,
	type SpaceDto,
} from "@/api/spaces";

export default function SpacesPage() {
	const {
		spaces,
		activeSpaceId,
		isAllView,
		loading,
		setActiveSpace,
		refreshSpaces,
	} = useSpace();
	const navigate = useNavigate();

	const [addOpen, setAddOpen] = useState(false);
	const [renaming, setRenaming] = useState<SpaceDto | null>(null);
	const [nameInput, setNameInput] = useState("");
	const [busy, setBusy] = useState(false);

	// Opening a space takes you back into the app, scoped to it.
	const open = (id: string | null) => {
		setActiveSpace(id);
		navigate("/dashboard");
	};

	const handleAdd = async () => {
		const name = nameInput.trim();
		if (!name) {
			toast.error("Please enter a space name.");
			return;
		}
		setBusy(true);
		try {
			const created = await createSpace(name);
			await refreshSpaces();
			setNameInput("");
			setAddOpen(false);
			toast.success(`Space "${created.name}" created`);
			// A brand-new space starts empty — open it so you can start there.
			open(created.id);
		} catch (error) {
			toast.error("Couldn't create the space. Is the name already used?");
			console.error(error);
		} finally {
			setBusy(false);
		}
	};

	const handleRename = async () => {
		if (!renaming) return;
		const name = nameInput.trim();
		if (!name) {
			toast.error("Please enter a space name.");
			return;
		}
		setBusy(true);
		try {
			await renameSpace(renaming.id, name);
			await refreshSpaces();
			setRenaming(null);
			setNameInput("");
			toast.success("Space renamed");
		} catch (error) {
			toast.error("Couldn't rename the space.");
			console.error(error);
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async (space: SpaceDto) => {
		if (space.sourceCount > 0) {
			toast.error(
				"This space still has sources. Remove them before deleting it.",
			);
			return;
		}
		if (spaces.length <= 1) {
			toast.error("You need at least one space.");
			return;
		}
		if (!window.confirm(`Delete the space "${space.name}"? This can't be undone.`))
			return;
		try {
			await deleteSpace(space.id);
			await refreshSpaces();
			toast.success("Space deleted");
		} catch (error) {
			toast.error("Couldn't delete the space.");
			console.error(error);
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-4xl">
				<div className="flex items-center justify-between gap-2 p-2">
					<div className="flex items-center gap-2">
						<BackButton />
						<h1 className="font-bold text-2xl">Spaces</h1>
					</div>
					<Button
						className="bg-brand"
						onClick={() => {
							setNameInput("");
							setAddOpen(true);
						}}>
						<Plus size={18} />
						<span className="hidden sm:inline">Add space</span>
					</Button>
				</div>
				<p className="px-2 text-sm text-muted-foreground">
					Keep money separate by purpose. Open a space to work inside it — its
					sources and transactions never mix with another&apos;s.
				</p>
			</header>

			<div className="mt-6 w-full max-w-4xl">
				{loading && (
					<div className="grid gap-3 sm:grid-cols-2">
						{[0, 1, 2].map((i) => (
							<Skeleton key={i} className="h-28 w-full rounded-xl" />
						))}
					</div>
				)}

				{!loading && spaces.length === 0 && (
					<ErrorState
						message="Couldn't load your spaces."
						onRetry={() => void refreshSpaces()}
					/>
				)}

				{!loading && spaces.length > 0 && (
					<div className="grid gap-3 sm:grid-cols-2">
						{/* The combined, read-only overview across every space. */}
						<button
							type="button"
							onClick={() => open(null)}
							className={cn(
								"flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition hover:border-brand",
								isAllView
									? "border-brand bg-brand/5"
									: "border-dashed border-border",
							)}>
							<div className="flex w-full items-center justify-between">
								<span className="flex items-center gap-2 font-semibold">
									<Eye size={18} className="text-brand" />
									All spaces
								</span>
								{isAllView && <Check size={18} className="text-brand" />}
							</div>
							<span className="text-sm text-muted-foreground">
								A combined, view-only overview. No adding or transacting here.
							</span>
						</button>

						{spaces.map((space) => {
							const active = space.id === activeSpaceId;
							return (
								<div
									key={space.id}
									className={cn(
										"flex flex-col gap-3 rounded-xl border p-4 transition",
										active ? "border-brand bg-brand/5" : "border-border",
									)}>
									<div className="flex items-start justify-between gap-2">
										<button
											type="button"
											onClick={() => open(space.id)}
											className="flex min-w-0 flex-1 flex-col items-start text-left">
											<span className="flex items-center gap-2 font-semibold">
												<Layers size={18} className="text-brand" />
												<span className="truncate">{space.name}</span>
												{space.isDefault && (
													<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
														default
													</span>
												)}
											</span>
											<span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
												<Wallet size={14} />
												{space.sourceCount}{" "}
												{space.sourceCount === 1 ? "source" : "sources"}
											</span>
										</button>
										{active && (
											<span className="flex shrink-0 items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs text-brand-foreground">
												<Check size={12} />
												Open
											</span>
										)}
									</div>

									<div className="flex items-center gap-2">
										{!active && (
											<Button
												size="sm"
												className="bg-brand"
												onClick={() => open(space.id)}>
												Open
											</Button>
										)}
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setNameInput(space.name);
												setRenaming(space);
											}}>
											<Pencil size={14} />
											Rename
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="text-danger hover:text-danger disabled:opacity-40"
											disabled={space.sourceCount > 0 || spaces.length <= 1}
											title={
												space.sourceCount > 0
													? "Remove this space's sources first"
													: spaces.length <= 1
														? "You need at least one space"
														: undefined
											}
											onClick={() => void handleDelete(space)}>
											<Trash2 size={14} />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Add space */}
			<UniversalModal
				open={addOpen}
				onOpenChange={setAddOpen}
				title="Add a space"
				description="A new space starts empty — no sources or transactions."
				footer={
					<div className="flex w-full flex-col gap-3">
						<Button className="bg-brand" disabled={busy} onClick={handleAdd}>
							{busy ? "Creating…" : "Create space"}
						</Button>
						<Button variant="ghost" onClick={() => setAddOpen(false)}>
							Cancel
						</Button>
					</div>
				}>
				<div className="w-full space-y-2">
					<label htmlFor="space-name" className="text-sm font-medium">
						Space name
					</label>
					<Input
						id="space-name"
						value={nameInput}
						onChange={(e) => setNameInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
						placeholder="eg. Business, Savings"
						autoFocus
					/>
				</div>
			</UniversalModal>

			{/* Rename space */}
			<UniversalModal
				open={renaming !== null}
				onOpenChange={(o) => !o && setRenaming(null)}
				title="Rename space"
				footer={
					<div className="flex w-full flex-col gap-3">
						<Button className="bg-brand" disabled={busy} onClick={handleRename}>
							{busy ? "Saving…" : "Save"}
						</Button>
						<Button variant="ghost" onClick={() => setRenaming(null)}>
							Cancel
						</Button>
					</div>
				}>
				<div className="w-full space-y-2">
					<label htmlFor="rename-space" className="text-sm font-medium">
						Space name
					</label>
					<Input
						id="rename-space"
						value={nameInput}
						onChange={(e) => setNameInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleRename()}
						autoFocus
					/>
				</div>
			</UniversalModal>
		</div>
	);
}

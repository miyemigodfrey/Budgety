"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
	Check,
	ChevronRight,
	Eye,
	Info,
	Layers,
	Pencil,
	Plus,
	RotateCcw,
	Trash2,
	TriangleAlert,
	Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import UniversalModal from "@/components/ui/modal";
import { span } from "@/components/app/grid";
import { useSpace } from "@/hooks/useSpace";
import { trpc } from "@/api/client";
import {
	createSpace,
	deleteSpace,
	renameSpace,
	type SpaceDto,
} from "@/api/spaces";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDate } from "@/lib/formatDate";

/** Running balance per currency (minor units). */
type Totals = Map<string, bigint>;

const addTo = (totals: Totals, currency: string, amount: bigint) =>
	totals.set(currency, (totals.get(currency) ?? 0n) + amount);

/** "₦1,200.00" — or "₦1,200.00 + $40.00" when a space mixes currencies. */
const formatTotals = (totals: Totals | undefined) => {
	if (!totals || totals.size === 0) return formatCurrency(0n);
	return [...totals.entries()]
		.map(([currency, amount]) => formatCurrency(amount, currency))
		.join(" + ");
};

const sourcesLabel = (n: number) => `${n} ${n === 1 ? "source" : "sources"}`;

const deleteReason = (space: SpaceDto, total: number) =>
	space.sourceCount > 0
		? `Remove its ${sourcesLabel(space.sourceCount)} before deleting`
		: total <= 1
			? "You need at least one space"
			: "";

const dashedCard: CSSProperties = {
	borderStyle: "dashed",
	borderWidth: 1.5,
	boxShadow: "none",
	background: "transparent",
};

export default function SpacesPage() {
	const {
		spaces,
		activeSpaceId,
		activeSpace,
		isAllView,
		loading,
		setActiveSpace,
		refreshSpaces,
	} = useSpace();
	const navigate = useNavigate();

	const [addOpen, setAddOpen] = useState(false);
	const [renaming, setRenaming] = useState<SpaceDto | null>(null);
	const [deleting, setDeleting] = useState<SpaceDto | null>(null);
	const [nameInput, setNameInput] = useState("");
	const [busy, setBusy] = useState(false);

	// Balances per space. Read once across every space (no space filter), then
	// grouped by spaceId — the page itself is never scoped to one space.
	const [balances, setBalances] = useState<{
		bySpace: Map<string, Totals>;
		all: Totals;
	} | null>(null);
	const [balancesFailed, setBalancesFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		trpc.sources.list
			.query({})
			.then((sources) => {
				if (cancelled) return;
				const bySpace = new Map<string, Totals>();
				const all: Totals = new Map();
				for (const s of sources) {
					const totals = bySpace.get(s.spaceId) ?? new Map<string, bigint>();
					addTo(totals, s.currency, s.remainingBalance);
					bySpace.set(s.spaceId, totals);
					addTo(all, s.currency, s.remainingBalance);
				}
				setBalances({ bySpace, all });
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Failed to load space balances:", error);
				setBalancesFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Opening a space takes you back into the app, scoped to it.
	const open = (id: string | null) => {
		setActiveSpace(id);
		navigate("/dashboard");
	};

	const startAdd = () => {
		setNameInput("");
		setAddOpen(true);
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

	const requestDelete = (space: SpaceDto) => {
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
		setDeleting(space);
	};

	const handleDelete = async () => {
		if (!deleting) return;
		setBusy(true);
		try {
			await deleteSpace(deleting.id);
			await refreshSpaces();
			setDeleting(null);
			toast.success("Space deleted");
		} catch (error) {
			toast.error("Couldn't delete the space.");
			console.error(error);
		} finally {
			setBusy(false);
		}
	};

	const balanceOf = (totals: Totals | undefined, size: "lg" | "sm") => {
		if (balancesFailed) return "—";
		if (!balances)
			return (
				<span
					className="sk"
					style={{ height: size === "lg" ? 26 : 14, width: size === "lg" ? 160 : 90 }}
				/>
			);
		return formatTotals(totals);
	};

	const totalSources = spaces.reduce((n, s) => n + s.sourceCount, 0);
	const activeName = isAllView ? "All spaces" : (activeSpace?.name ?? "—");

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<h1 className="t-h1">Spaces</h1>
					<p className="t-muted" style={{ maxWidth: 620 }}>
						Keep money separate by purpose. Open a space to work inside it — its
						sources and transactions never mix with another&rsquo;s.
					</p>
				</div>
				<div className="page-h-actions hide-m">
					<button className="btn btn-primary" type="button" onClick={startAdd}>
						<Plus className="ic ic-sm" />
						Add space
					</button>
				</div>
				<div className="page-h-actions show-m" style={{ width: "100%" }}>
					<button
						className="btn btn-primary btn-block"
						type="button"
						onClick={startAdd}>
						<Plus className="ic ic-sm" />
						Add space
					</button>
				</div>
			</div>

			{loading && (
				<div className="g g-stretch">
					{[0, 1, 2].map((i) => (
						<div key={i} className="card stack" style={span({ d: 4, t: 6, m: 12 })}>
							<span className="sk" style={{ height: 36, width: 36, borderRadius: 10 }} />
							<span className="sk" style={{ height: 26, width: "60%" }} />
							<span className="sk" style={{ height: 14, width: "40%" }} />
						</div>
					))}
				</div>
			)}

			{!loading && spaces.length === 0 && (
				<section className="card empty" role="alert">
					<span
						className="empty-ic"
						style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
						<TriangleAlert className="ic ic-lg" />
					</span>
					<h2 className="t-h3">Couldn&rsquo;t load your spaces.</h2>
					<p>Check your connection and try again.</p>
					<button
						className="btn btn-secondary"
						type="button"
						onClick={() => void refreshSpaces()}>
						<RotateCcw className="ic ic-sm" />
						Try again
					</button>
				</section>
			)}

			{!loading && spaces.length > 0 && (
				<>
					{/* Summary strip */}
					<div className="g">
						<section className="card stat" style={span({ d: 4, t: 4, m: 6 })}>
							<span className="stat-l">Across all spaces</span>
							<span className="stat-v trunc">{balanceOf(balances?.all, "lg")}</span>
							<span className="stat-d">
								{sourcesLabel(totalSources)} · {spaces.length}{" "}
								{spaces.length === 1 ? "space" : "spaces"}
							</span>
						</section>
						<section className="card stat" style={span({ d: 4, t: 4, m: 6 })}>
							<span className="stat-l">Open now</span>
							<span className="stat-v trunc" style={{ fontSize: 22 }}>
								{activeName}
							</span>
							<span className="stat-d">
								{isAllView || !activeSpace ? (
									"Read-only overview of every space"
								) : (
									<>
										{sourcesLabel(activeSpace.sourceCount)} ·{" "}
										{balanceOf(balances?.bySpace.get(activeSpace.id), "sm")}
									</>
								)}
							</span>
						</section>
						<section
							className="card"
							style={span(
								{ d: 4, t: 4, m: 12 },
								{ display: "flex", gap: 12, alignItems: "flex-start" },
							)}>
							<span className="ic-tile neutral">
								<Eye className="ic" />
							</span>
							<div className="stack-sm" style={{ gap: 4 }}>
								<span className="t-sm t-strong">
									&ldquo;All spaces&rdquo; is view only
								</span>
								<span className="t-xs t-muted">
									Browse balances and reports across every space. To add sources
									or transactions, open a single space.
								</span>
							</div>
						</section>
					</div>

					<div className="g g-stretch">
						{/* The combined, read-only overview across every space. */}
						<button
							type="button"
							className="card stack"
							aria-current={isAllView ? "true" : undefined}
							onClick={() => open(null)}
							style={span(
								{ d: 4, t: 6, m: 12 },
								{
									...dashedCard,
									textAlign: "left",
									gap: 14,
									...(isAllView
										? {
												borderColor: "var(--brand)",
												borderStyle: "solid",
												background: "var(--brand-soft)",
											}
										: {}),
								},
							)}>
							<div className="between">
								<span className="row-f">
									<span className="ic-tile">
										<Eye className="ic" />
									</span>
									<span className="t-h3">All spaces</span>
								</span>
								{isAllView ? (
									<span className="badge brand">
										<Check className="ic ic-xs" />
										Open
									</span>
								) : (
									<span className="badge outline">View only</span>
								)}
							</div>
							<span className="amt amt-lg">{balanceOf(balances?.all, "lg")}</span>
							<span className="t-sm t-muted">
								A combined, view-only overview. No adding or transacting here.
							</span>
							<span className="card-link" style={{ marginTop: "auto" }}>
								View overview
								<ChevronRight className="ic ic-sm" />
							</span>
						</button>

						{spaces.map((space) => {
							const active = space.id === activeSpaceId;
							const reason = deleteReason(space, spaces.length);
							return (
								<section
									key={space.id}
									className="card stack"
									aria-label={`Space ${space.name}`}
									style={span(
										{ d: 4, t: 6, m: 12 },
										{
											gap: 14,
											...(active
												? {
														borderColor: "var(--brand)",
														boxShadow: "0 0 0 4px var(--brand-soft)",
													}
												: {}),
										},
									)}>
									<div className="between" style={{ alignItems: "flex-start" }}>
										<span className="row-f">
											<span
												className="space-dot"
												aria-hidden="true"
												style={{ width: 36, height: 36, borderRadius: 10, fontSize: 14 }}>
												{space.name.trim()[0]?.toUpperCase() ?? "?"}
											</span>
											<span className="stack-sm" style={{ gap: 2 }}>
												<span className="row-f" style={{ gap: 6 }}>
													<span className="t-h3 trunc">{space.name}</span>
													{space.isDefault && (
														<span className="badge outline">default</span>
													)}
												</span>
												<span className="t-xs t-muted row-f" style={{ gap: 4 }}>
													<Wallet className="ic ic-xs" />
													{sourcesLabel(space.sourceCount)}
												</span>
											</span>
										</span>
										{active && (
											<span className="badge brand">
												<Check className="ic ic-xs" />
												Open
											</span>
										)}
									</div>
									<span className="amt amt-lg">
										{balanceOf(balances?.bySpace.get(space.id), "lg")}
									</span>
									<span className="t-xs t-muted">
										Created {formatDate(space.createdAt)}
										{space.sourceCount === 0 ? " · no sources yet" : ""}
									</span>
									<div
										className="row-f"
										style={{
											marginTop: "auto",
											gap: 6,
											borderTop: "1px solid var(--border)",
											paddingTop: 12,
										}}>
										{active ? (
											<span
												className="t-sm t-strong tr"
												style={{ padding: "0 4px" }}>
												You&rsquo;re in this space
											</span>
										) : (
											<button
												className="btn btn-primary btn-sm"
												type="button"
												onClick={() => open(space.id)}>
												Open
											</button>
										)}
										<button
											className="btn btn-ghost btn-sm"
											type="button"
											style={{ marginLeft: "auto" }}
											onClick={() => {
												setNameInput(space.name);
												setRenaming(space);
											}}>
											<Pencil className="ic ic-sm" />
											Rename
										</button>
										<button
											className="btn btn-ghost btn-sm btn-icon out"
											type="button"
											aria-label={`Delete ${space.name}`}
											title={reason || undefined}
											disabled={reason !== ""}
											onClick={() => requestDelete(space)}>
											<Trash2 className="ic ic-sm" />
										</button>
									</div>
									{reason && (
										<span
											className="t-xs t-muted row-f"
											style={{ gap: 6, marginTop: -6 }}>
											<Info className="ic ic-xs" />
											{reason}
										</span>
									)}
								</section>
							);
						})}

						{/* Add space */}
						<button
							type="button"
							className="card"
							onClick={startAdd}
							style={span(
								{ d: 4, t: 6, m: 12 },
								{
									...dashedCard,
									borderColor: "var(--brand-line)",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: 10,
									minHeight: 200,
									color: "var(--brand)",
								},
							)}>
							<span className="empty-ic" style={{ margin: 0 }}>
								<Plus className="ic ic-lg" />
							</span>
							<span className="t-h3">Add a space</span>
							<span className="t-xs t-muted">
								e.g. Business, Savings, Travel. A new space starts empty.
							</span>
						</button>
					</div>
				</>
			)}

			{/* Add space */}
			<UniversalModal
				open={addOpen}
				onOpenChange={setAddOpen}
				title="Add a space"
				description="A new space starts empty — no sources or transactions."
				footer={
					<>
						<span className="grow hide-m" />
						<button
							className="btn btn-ghost"
							type="button"
							onClick={() => setAddOpen(false)}>
							Cancel
						</button>
						<button
							className="btn btn-primary"
							type="button"
							disabled={busy}
							onClick={handleAdd}>
							{busy ? "Creating…" : "Create space"}
						</button>
					</>
				}>
				<div className="field">
					<label htmlFor="space-name" className="label">
						Space name
					</label>
					<div className="control">
						<Layers className="ic" />
						<input
							id="space-name"
							className="input has-ic"
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleAdd()}
							placeholder="eg. Business, Savings"
							autoFocus
						/>
					</div>
				</div>
			</UniversalModal>

			{/* Rename space */}
			<UniversalModal
				open={renaming !== null}
				onOpenChange={(o) => !o && setRenaming(null)}
				title="Rename space"
				footer={
					<>
						<span className="grow hide-m" />
						<button
							className="btn btn-ghost"
							type="button"
							onClick={() => setRenaming(null)}>
							Cancel
						</button>
						<button
							className="btn btn-primary"
							type="button"
							disabled={busy}
							onClick={handleRename}>
							{busy ? "Saving…" : "Save"}
						</button>
					</>
				}>
				<div className="field">
					<label htmlFor="rename-space" className="label">
						Space name
					</label>
					<div className="control">
						<Layers className="ic" />
						<input
							id="rename-space"
							className="input has-ic"
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleRename()}
							autoFocus
						/>
					</div>
				</div>
			</UniversalModal>

			{/* Delete space */}
			<UniversalModal
				open={deleting !== null}
				onOpenChange={(o) => !o && setDeleting(null)}
				title="Delete space?"
				description={
					deleting
						? `"${deleting.name}" will be deleted. This can't be undone.`
						: undefined
				}
				footer={
					<>
						<span className="grow hide-m" />
						<button
							className="btn btn-ghost"
							type="button"
							onClick={() => setDeleting(null)}>
							Cancel
						</button>
						<button
							className="btn btn-danger"
							type="button"
							disabled={busy}
							onClick={handleDelete}>
							<Trash2 className="ic ic-sm" />
							{busy ? "Deleting…" : "Delete space"}
						</button>
					</>
				}>
				<p className="t-sm t-muted">
					Only a space with no sources can be deleted.
				</p>
			</UniversalModal>
		</main>
	);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Info, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteSource, getSources, type Source } from "@/api/sources";
import { trpc } from "@/api/client";
import { spaceArg } from "@/api/activeSpace";
import { useSpace } from "@/hooks/useSpace";
import { span } from "@/components/app/grid";
import { formatCurrency } from "@/lib/formatCurrency";
import { getErrorMessage } from "@/lib/apiError";
import AddSourceModal from "../addsource/sourceModal";
import { SourceEditorFields, useSourceEditor } from "../addsource/EditSourceModal";
import { ErrorCard, sourceLook } from "../addsource/sourceUi";

const txCount = (n: number) => `${n} ${n === 1 ? "transaction" : "transactions"}`;

export default function ManageSourcePage() {
	const { isAllView, activeSpace, refreshSpaces } = useSpace();
	const [source, setSource] = useState<Source[]>([]);
	const [counts, setCounts] = useState<Map<string, number>>(new Map());
	const [loading, setLoading] = useState(true);
	const [failed, setFailed] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	const [addOpen, setAddOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const editorRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let cancelled = false;
		const fetchSources = async () => {
			try {
				setLoading(true);
				setFailed(false);
				const data = await getSources();
				if (cancelled) return;
				setSource(data);
				// Open the first source in the editor, like the canvas.
				setSelectedId((cur) => (cur && data.some((s) => s.id === cur) ? cur : (data[0]?.id ?? null)));
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to fetch sources:", error);
				toast.error("Failed to load sources");
				setFailed(true);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchSources();
		// Transaction counts only decorate the rows; a failure just hides them.
		trpc.sources.overview
			.query(spaceArg())
			.then((o) => {
				if (!cancelled) setCounts(new Map(o.sources.map((s) => [s.id, s.transactionCount])));
			})
			.catch((e) => console.error("Failed to load source counts:", e));
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	const selected = source.find((s) => s.id === selectedId) ?? null;
	const selectedIndex = source.findIndex((s) => s.id === selectedId);

	const select = useCallback((id: string, confirm: boolean) => {
		setSelectedId(id);
		setConfirming(confirm);
		// On tablet and phone the editor sits under the list — bring it into view.
		if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
			requestAnimationFrame(() =>
				editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
			);
		}
	}, []);

	const handleDelete = async (id: string) => {
		try {
			setDeleting(true);
			await deleteSource(id);
			const next = source.filter((item) => item.id !== id);
			setSource(next);
			setSelectedId(next[0]?.id ?? null);
			setConfirming(false);
			void refreshSpaces();
			toast.warning("Source deleted successfully");
		} catch (error) {
			console.error("Failed to delete source:", error);
			toast.error(getErrorMessage(error, "Failed to delete source"));
		} finally {
			setDeleting(false);
		}
	};

	const spaceName = isAllView ? "all spaces" : (activeSpace?.name ?? "this space");
	const currency = source[0]?.currency ?? "NGN";
	const total = source.reduce((s, x) => s + BigInt(x.balance), 0n);
	const addTitle = isAllView ? "Open a space to add a source" : undefined;

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<Link to="/setting" className="back">
						<ArrowLeft className="ic ic-sm" />
						Settings
					</Link>
					<h1 className="t-h1">Manage sources</h1>
					<p className="t-muted">
						Rename, correct or remove the money sources in <strong className="t-fg2">{spaceName}</strong>.
					</p>
				</div>
				<div className="page-h-actions show-m" style={{ width: "100%" }}>
					<button
						type="button"
						className="btn btn-primary btn-block"
						disabled={isAllView}
						title={addTitle}
						onClick={() => setAddOpen(true)}>
						<Plus className="ic ic-sm" />
						Add source
					</button>
				</div>
			</div>

			{loading ? (
				<div className="g" aria-busy="true" aria-label="Loading sources">
					<section className="card card-flush" style={span({ d: 7, l: 7, t: 12 })}>
						<div className="card-h">
							<span className="sk" style={{ height: 18, width: 160 }} />
						</div>
						<div className="list">
							{[0, 1, 2].map((i) => (
								<div key={i} className="li">
									<span className="sk" style={{ width: 40, height: 40, borderRadius: 12 }} />
									<div className="li-main" style={{ gap: 6 }}>
										<span className="sk" style={{ height: 14, width: "40%" }} />
										<span className="sk" style={{ height: 12, width: "60%" }} />
									</div>
								</div>
							))}
						</div>
					</section>
					<span className="sk hide-t" style={span({ d: 5, l: 5, t: 12 }, { height: 320, borderRadius: 16 })} />
				</div>
			) : failed ? (
				<ErrorCard message="Couldn't load your sources." onRetry={() => setReloadKey((k) => k + 1)} />
			) : source.length === 0 ? (
				<section className="card empty">
					<span className="empty-ic">
						<Wallet className="ic ic-lg" />
					</span>
					<p className="t-h3">No sources to manage</p>
					<p>Once you add a money source it&apos;ll appear here for editing.</p>
					<button
						type="button"
						className="btn btn-primary"
						disabled={isAllView}
						title={addTitle}
						onClick={() => setAddOpen(true)}>
						<Plus className="ic ic-sm" />
						Add a source
					</button>
				</section>
			) : (
				<div className="g">
					{/* Source list */}
					<section className="card card-flush" style={span({ d: 7, l: 7, t: 12 })} aria-label="Sources">
						<div className="card-h">
							<div>
								<p className="card-t">Your sources</p>
								<p className="card-s">
									{source.length} {source.length === 1 ? "source" : "sources"} ·{" "}
									{formatCurrency(total, currency)} in total
								</p>
							</div>
							<button
								type="button"
								className="btn btn-soft btn-sm hide-m"
								disabled={isAllView}
								title={addTitle}
								onClick={() => setAddOpen(true)}>
								<Plus className="ic ic-sm" />
								Add
							</button>
						</div>
						<ul className="list">
							{source.map((s, i) => {
								const { Icon, color } = sourceLook(s.name, i);
								const isSel = s.id === selectedId;
								const count = counts.get(s.id);
								return (
									<li key={s.id} className={`li${isSel ? " src-sel" : ""}`}>
										<span className="li-ic" style={{ color }}>
											<Icon className="ic" />
										</span>
										<div className="li-main">
											<span className="li-t">
												<span className="trunc">{s.name}</span>
												{isSel && <span className="badge tr">Editing</span>}
											</span>
											<span className="li-s">
												<span className="amt" style={{ fontWeight: 600, color: "var(--fg-2)" }}>
													{formatCurrency(s.balance, s.currency)}
												</span>
												{count !== undefined && (
													<>
														<span aria-hidden="true">·</span>
														<span>{txCount(count)}</span>
													</>
												)}
											</span>
										</div>
										<button
											type="button"
											className="btn btn-secondary btn-sm"
											aria-label={`Edit ${s.name}`}
											aria-pressed={isSel && !confirming}
											onClick={() => select(s.id, false)}>
											<Pencil className="ic ic-sm" />
											<span className="hide-m">Edit</span>
										</button>
										<button
											type="button"
											className="btn btn-ghost btn-sm btn-icon out"
											aria-label={`Delete ${s.name}`}
											onClick={() => select(s.id, true)}>
											<Trash2 className="ic ic-sm" />
										</button>
									</li>
								);
							})}
						</ul>
						<div className="card-foot">
							<span className="row-f t-sm t-muted">
								<Info className="ic ic-sm" />
								{isAllView
									? "Showing every space. Open a space to add sources to it."
									: "Sources belong to one space. Switch space to manage another set."}
							</span>
						</div>
					</section>

					{/* Edit panel */}
					<div className="stack" style={span({ d: 5, l: 5, t: 12 })} ref={editorRef}>
						{selected ? (
							<>
								<SourceEditorCard
									key={selected.id}
									source={selected}
									index={selectedIndex}
									onClose={() => {
										setSelectedId(null);
										setConfirming(false);
									}}
									onUpdated={(updated) =>
										setSource((prev) =>
											prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
										)
									}
								/>
								<DeleteSourceCard
									source={selected}
									count={counts.get(selected.id)}
									confirming={confirming}
									setConfirming={setConfirming}
									deleting={deleting}
									onDelete={() => handleDelete(selected.id)}
								/>
							</>
						) : (
							<section className="card empty hide-t">
								<span className="empty-ic">
									<Pencil className="ic ic-lg" />
								</span>
								<p className="t-h3">Pick a source</p>
								<p>Choose Edit on a source to rename it or correct its balance.</p>
							</section>
						)}
					</div>
				</div>
			)}

			<AddSourceModal
				open={addOpen}
				setOpen={setAddOpen}
				onCreated={(newSource) => {
					setSource((prev) => [newSource, ...prev]);
					setCounts((prev) => new Map(prev).set(newSource.id, 0));
				}}
			/>
		</main>
	);
}

function SourceEditorCard({
	source,
	index,
	onClose,
	onUpdated,
}: {
	source: Source;
	index: number;
	onClose: () => void;
	onUpdated: (s: Source) => void;
}) {
	const editor = useSourceEditor(source, onUpdated);
	const { Icon, color } = sourceLook(source.name, Math.max(0, index));
	return (
		<section className="card stack" aria-label="Edit source" style={{ gap: 18 }}>
			<div className="between" style={{ alignItems: "flex-start" }}>
				<div className="row-f">
					<span className="ic-tile" style={{ color }}>
						<Icon className="ic" />
					</span>
					<div style={{ minWidth: 0 }}>
						<p className="card-t">Edit source</p>
						<p className="card-s trunc">
							{source.name} · {formatCurrency(source.balance, source.currency)} now
						</p>
					</div>
				</div>
				<button type="button" className="btn btn-ghost btn-sm btn-icon" aria-label="Close editor" onClick={onClose}>
					<X className="ic ic-sm" />
				</button>
			</div>
			<SourceEditorFields editor={editor} source={source} />
			<div className="row-f" style={{ gap: 10, justifyContent: "flex-end" }}>
				<button type="button" className="btn btn-ghost" onClick={editor.reset}>
					Cancel
				</button>
				<button type="button" className="btn btn-primary" disabled={editor.isSaving} onClick={() => void editor.save()}>
					<Check className="ic ic-sm" />
					{editor.isSaving ? "Saving…" : "Save changes"}
				</button>
			</div>
		</section>
	);
}

function DeleteSourceCard({
	source,
	count,
	confirming,
	setConfirming,
	deleting,
	onDelete,
}: {
	source: Source;
	count: number | undefined;
	confirming: boolean;
	setConfirming: (v: boolean) => void;
	deleting: boolean;
	onDelete: () => void;
}) {
	const txs = count === undefined ? "its transactions" : count === 0 ? null : `its ${txCount(count)}`;
	return (
		<section
			className="card stack-sm"
			aria-label="Delete source"
			style={{ gap: 12, borderColor: "color-mix(in oklch, var(--danger) 30%, var(--border))" }}>
			<div className="row-f">
				<span className="ic-tile out">
					<Trash2 className="ic" />
				</span>
				<div style={{ minWidth: 0 }}>
					<p className="card-t trunc">Delete {source.name}</p>
					<p className="card-s">This can’t be undone.</p>
				</div>
			</div>
			<p className="t-sm t-fg2">
				{txs
					? `Deleting ${source.name} also deletes ${txs}, including transfers to or from it.`
					: `${source.name} has no transactions, so only the source is removed.`}
			</p>
			{confirming ? (
				<div
					className="stack-sm"
					role="alertdialog"
					aria-label="Confirm delete"
					style={{ gap: 12, padding: 14, borderRadius: 12, background: "var(--danger-soft)" }}>
					<span className="t-sm t-strong out">
						Delete {source.name}
						{txs ? ` and ${txs.replace(/^its /, "")}` : ""}?
					</span>
					<div className="row-f wrap" style={{ gap: 8 }}>
						<button type="button" className="btn btn-danger-fill" disabled={deleting} onClick={onDelete}>
							{deleting ? "Deleting…" : "Yes, delete"}
						</button>
						<button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>
							Keep it
						</button>
					</div>
				</div>
			) : (
				<div>
					<button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
						<Trash2 className="ic ic-sm" />
						Delete source
					</button>
				</div>
			)}
		</section>
	);
}

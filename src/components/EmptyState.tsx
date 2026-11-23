import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
};

/**
 * Shown when a list or panel has no data yet. Keeps "nothing here" visually
 * distinct from "still loading" and from "something went wrong".
 * Canvas `.empty` pattern (budgety.css).
 */
export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div className={cn("empty", className)}>
			{Icon && (
				<span className="empty-ic">
					<Icon className="ic ic-xl" aria-hidden="true" />
				</span>
			)}
			<h3 className="t-h3">{title}</h3>
			{description && <p>{description}</p>}
			{action && <div style={{ marginTop: 4 }}>{action}</div>}
		</div>
	);
}

type ErrorStateProps = {
	message?: string;
	onRetry?: () => void;
	className?: string;
};

/**
 * Shown when a fetch fails, with a way to recover. Previously these failures
 * were only logged to the console.
 */
export function ErrorState({
	message = "Something went wrong loading this.",
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div role="alert" className={cn("empty", className)}>
			<span
				className="empty-ic"
				style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
				<AlertTriangle className="ic ic-xl" aria-hidden="true" />
			</span>
			<h3 className="t-h3">{message}</h3>
			{onRetry && (
				<button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
					Try again
				</button>
			)}
		</div>
	);
}

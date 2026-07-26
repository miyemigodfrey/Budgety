import type { LucideIcon } from "lucide-react";
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
 */
export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"w-full flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed border-border px-6 py-10",
				className,
			)}>
			{Icon && <Icon className="size-8 text-muted-foreground" aria-hidden="true" />}
			<p className="font-semibold text-foreground">{title}</p>
			{description && (
				<p className="text-sm text-muted-foreground max-w-sm">{description}</p>
			)}
			{action && <div className="mt-2">{action}</div>}
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
		<div
			role="alert"
			className={cn(
				"w-full flex flex-col items-center justify-center text-center gap-3 rounded-xl border border-dashed border-danger/50 bg-danger-surface px-6 py-10",
				className,
			)}>
			<p className="text-sm font-medium text-danger">{message}</p>
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="text-sm font-semibold text-danger underline underline-offset-4 hover:no-underline">
					Try again
				</button>
			)}
		</div>
	);
}

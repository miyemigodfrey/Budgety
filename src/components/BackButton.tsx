"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Navigates to the previous page in history. Used in page headers so any route
 * is easy to back out of.
 */
export function BackButton({ className }: { className?: string }) {
	const router = useRouter();
	return (
		<button
			type="button"
			onClick={() => router.back()}
			aria-label="Go back"
			className={cn(
				"inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground",
				className,
			)}>
			<ArrowLeft className="size-6" />
		</button>
	);
}

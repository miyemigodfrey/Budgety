"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Granularity } from "@/api/transaction";

const OPTIONS: { value: Granularity; label: string }[] = [
	{ value: "weekly", label: "Weekly" },
	{ value: "biweekly", label: "Bi-weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
];

export const granularityLabel = (g: Granularity) =>
	OPTIONS.find((o) => o.value === g)?.label ?? "Monthly";

/** Weekly / Bi-weekly / Monthly / Yearly picker shared across the chart areas. */
export function GranularitySelect({
	value,
	onChange,
	className,
}: {
	value: Granularity;
	onChange: (value: Granularity) => void;
	className?: string;
}) {
	return (
		<Select value={value} onValueChange={(v) => onChange(v as Granularity)}>
			<SelectTrigger className={className ?? "h-8 w-32 text-xs"} size="sm">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{OPTIONS.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

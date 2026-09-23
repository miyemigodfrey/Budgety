"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { LucideIcon } from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/EmptyState";
import { formatPeriod } from "@/lib/formatPeriod";
import { formatCurrency } from "@/lib/formatCurrency";
import { toMajor } from "@/lib/money";
import type { TrendPoint } from "@/api/transaction";

type FlowKey = "inflow" | "outflow" | "transfer";

const FLOW_COLOR: Record<FlowKey, string> = {
	inflow: "var(--success)",
	outflow: "var(--danger)",
	transfer: "var(--brand)",
};

/**
 * One consistent monthly-trend bar chart for a single flow direction. Replaces
 * the three mismatched charts (a balance doughnut mislabelled "Inflow", an area
 * chart, and a line chart) so all three tabs read the same way and actually show
 * the inflow / outflow / transfer totals from the trend series.
 *
 * Amounts are BigInt minor units and are converted with toMajor before recharts
 * (which does arithmetic on the values) ever sees them.
 */
export function FlowTrendChart({
	series,
	flow,
	title,
	description,
	emptyTitle,
	emptyDescription,
	icon: Icon,
}: {
	series?: TrendPoint[];
	flow: FlowKey;
	title: string;
	description: string;
	emptyTitle: string;
	emptyDescription: string;
	icon: LucideIcon;
}) {
	const data = (series ?? []).map((p) => ({
		month: formatPeriod(p.period),
		value: toMajor(p[flow]),
	}));
	const hasData = data.some((d) => d.value > 0);

	const chartConfig = {
		value: { label: title, color: FLOW_COLOR[flow] },
	} satisfies ChartConfig;

	return (
		<Card className="border border-border">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ChartContainer config={chartConfig}>
						<BarChart data={data} margin={{ left: 12, right: 12 }}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										hideLabel
										formatter={(v) => formatCurrency(Number(v))}
									/>
								}
							/>
							<Bar dataKey="value" fill="var(--color-value)" radius={6} />
						</BarChart>
					</ChartContainer>
				) : (
					<EmptyState
						icon={Icon}
						title={emptyTitle}
						description={emptyDescription}
					/>
				)}
			</CardContent>
		</Card>
	);
}

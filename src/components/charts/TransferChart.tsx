"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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
import { ArrowLeftRight } from "lucide-react";
import { formatPeriod } from "@/lib/formatPeriod";
import type { TrendPoint } from "@/api/transaction";

export const description = "Monthly transfers";

const chartConfig = {
	transfer: {
		label: "Transfer",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export function TransferOverviewChart({ series }: { series?: TrendPoint[] }) {
	const hasData = series?.some((p) => p.transfer > 0);

	const data = (series ?? []).map((p) => ({
		month: formatPeriod(p.period),
		transfer: p.transfer,
	}));

	return (
		<Card className="border border-border">
			<CardHeader>
				<CardTitle>Sources Transfer Chart</CardTitle>
				<CardDescription>
					Showing transfers between sources for the last 6 months
				</CardDescription>
			</CardHeader>

			<CardContent>
				{hasData ? (
					<ChartContainer config={chartConfig}>
						<LineChart
							accessibilityLayer
							data={data}
							margin={{ left: 12, right: 12 }}>
							<CartesianGrid vertical={false} />

							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>

							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent indicator="dot" />}
							/>

							<Line
								dataKey="transfer"
								type="monotone"
								stroke="var(--color-transfer)"
								strokeWidth={2}
								dot={{ fill: "var(--color-transfer)" }}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ChartContainer>
				) : (
					<EmptyState
						icon={ArrowLeftRight}
						title="No transfers yet"
						description="Move money between two sources and it'll be charted here."
					/>
				)}
			</CardContent>
		</Card>
	);
}

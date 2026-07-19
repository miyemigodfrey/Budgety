"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import { TrendingDown } from "lucide-react";
import { formatPeriod } from "@/lib/formatPeriod";
import type { TrendPoint } from "@/api/transaction";

export const description = "Monthly outflow";

const chartConfig = {
	outflow: {
		label: "Outflow",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

export function OutflowOverviewChart({ series }: { series?: TrendPoint[] }) {
	const hasData = series?.some((p) => p.outflow > 0);

	const data = (series ?? []).map((p) => ({
		month: formatPeriod(p.period),
		outflow: p.outflow,
	}));

	return (
		<Card className="border border-border">
			<CardHeader>
				<CardTitle>Sources Outflow Chart</CardTitle>
				<CardDescription>
					Showing total spending for the last 6 months
				</CardDescription>
			</CardHeader>

			<CardContent>
				{hasData ? (
					<ChartContainer config={chartConfig}>
						<AreaChart
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

							<Area
								dataKey="outflow"
								type="linear"
								fill="var(--color-outflow)"
								fillOpacity={0.4}
								stroke="var(--color-outflow)"
								dot={{ fill: "var(--color-outflow)" }}
								activeDot={{ r: 6 }}
							/>
						</AreaChart>
					</ChartContainer>
				) : (
					<EmptyState
						icon={TrendingDown}
						title="No outflow yet"
						description="Once you record spending, your monthly outflow will show up here."
					/>
				)}
			</CardContent>
		</Card>
	);
}

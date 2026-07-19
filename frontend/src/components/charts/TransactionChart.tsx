"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
import { BarChart3 } from "lucide-react";
import { formatPeriod } from "@/lib/formatPeriod";

const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

type TotalSeries = { period: string; total: number }[];
type BreakdownSeries = {
	period: string;
	sources: { sourceId: string; sourceName: string; amount: number }[];
}[];

/* ---------------- TOTAL TRANSACTIONS ---------------- */

const totalChartConfig = {
	total: {
		label: "Total",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function TotalTransactionBarChart({
	series,
}: {
	series?: TotalSeries;
}) {
	const totalData = (series ?? []).map((item) => ({
		month: formatPeriod(item.period),
		total: item.total,
	}));

	const hasData = totalData.some((d) => d.total > 0);

	return (
		<Card className="border border-border drop-shadow-xl">
			<CardHeader>
				<CardTitle>Total Transactions</CardTitle>
				<CardDescription>Monthly totals</CardDescription>
			</CardHeader>

			<CardContent>
				{hasData ? (
					<ChartContainer config={totalChartConfig}>
						<BarChart data={totalData}>
							<CartesianGrid vertical={false} />

							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={10}
								tickFormatter={(v) => v.slice(0, 3)}
							/>

							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>

							<Bar dataKey="total" fill="var(--color-total)" radius={8} />
						</BarChart>
					</ChartContainer>
				) : (
					<EmptyState
						icon={BarChart3}
						title="No transaction data yet"
						description="Your monthly totals will appear here once you record transactions."
					/>
				)}
			</CardContent>
		</Card>
	);
}

/* ---------------- BREAKDOWN TRANSACTIONS ---------------- */

export function TransactionBreakdownChart({
	series,
}: {
	series?: BreakdownSeries;
}) {
	// Unique source names across the window become the bars. Keys must be
	// CSS-identifier-safe because the chart derives `--color-<key>` vars.
	const names = Array.from(
		new Set((series ?? []).flatMap((w) => w.sources.map((s) => s.sourceName))),
	);
	const toKey = (name: string, i: number) =>
		`${name.replace(/[^a-zA-Z0-9]/g, "-")}-${i}`;
	const keyByName = new Map(names.map((name, i) => [name, toKey(name, i)]));
	const sourceKeys = names.map((name) => keyByName.get(name)!);
	const config = Object.fromEntries(
		names.map((name, i) => [
			keyByName.get(name)!,
			{ label: name, color: CHART_COLORS[i % CHART_COLORS.length] },
		]),
	) satisfies ChartConfig;
	const data = (series ?? []).map((w) => {
		const row: Record<string, string | number> = {
			month: formatPeriod(w.period),
		};
		for (const name of names) {
			row[keyByName.get(name)!] = w.sources
				.filter((s) => s.sourceName === name)
				.reduce((sum, s) => sum + s.amount, 0);
		}
		return row;
	});

	const hasData = data.some((row) =>
		sourceKeys.some((k) => Number(row[k]) > 0),
	);

	if (!hasData) {
		return (
			<Card className="border border-border drop-shadow-xl">
				<CardHeader>
					<CardTitle>Transaction Breakdown</CardTitle>
					<CardDescription>By source</CardDescription>
				</CardHeader>
				<CardContent>
					<EmptyState
						icon={BarChart3}
						title="No breakdown yet"
						description="Once you have transactions across sources, they'll be compared here."
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border border-border drop-shadow-xl">
			<CardHeader>
				<CardTitle>Transaction Breakdown</CardTitle>
				<CardDescription>By source</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer config={config}>
					<BarChart data={data}>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							tickFormatter={(v) => String(v).slice(0, 3)}
						/>

						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dashed" />}
						/>

						{sourceKeys.map((key) => (
							<Bar
								key={key}
								dataKey={key}
								fill={`var(--color-${key})`}
								radius={4}
							/>
						))}
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

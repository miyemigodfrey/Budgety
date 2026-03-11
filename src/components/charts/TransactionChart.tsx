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

const chartData = [
	{ month: "January", opay: 200, access: 180, cash: 100 },
	{ month: "February", opay: 260, access: 210, cash: 150 },
	{ month: "March", opay: 230, access: 200, cash: 100 },
	{ month: "April", opay: 150, access: 160, cash: 80 },
	{ month: "May", opay: 310, access: 240, cash: 150 },
	{ month: "June", opay: 280, access: 230, cash: 130 },
];

/* ---------------- TOTAL TRANSACTIONS ---------------- */

const totalChartConfig = {
	total: {
		label: "Total",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function TotalTransactionBarChart() {
	const totalData = chartData.map((item) => ({
		month: item.month,
		total: item.opay + item.access + item.cash,
	}));

	return (
		<Card className="border border-gray-200 drop-shadow-xl">
			<CardHeader>
				<CardTitle>Total Transactions</CardTitle>
				<CardDescription>January - June 2024</CardDescription>
			</CardHeader>

			<CardContent>
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
			</CardContent>
		</Card>
	);
}

/* ---------------- BREAKDOWN TRANSACTIONS ---------------- */

const breakdownChartConfig = {
	opay: {
		label: "Opay",
		color: "var(--chart-1)",
	},
	access: {
		label: "Access",
		color: "var(--chart-2)",
	},
	cash: {
		label: "Cash",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

export function TransactionBreakdownChart() {
	return (
		<Card className="border border-gray-200 drop-shadow-xl">
			<CardHeader>
				<CardTitle>Transaction Breakdown</CardTitle>
				<CardDescription>Opay • Access • Cash</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer config={breakdownChartConfig}>
					<BarChart data={chartData}>
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
							content={<ChartTooltipContent indicator="dashed" />}
						/>

						<Bar dataKey="opay" fill="var(--color-opay)" radius={4} />
						<Bar dataKey="access" fill="var(--color-access)" radius={4} />
						<Bar dataKey="cash" fill="var(--color-cash)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

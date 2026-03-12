"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

export const description = "A multiple line chart";

const chartData = [
	{ month: "January", opay: 186, access: 80, zenith: 50 },
	{ month: "February", opay: 305, access: 200, zenith: 120 },
	{ month: "March", opay: 237, access: 120, zenith: 90 },
	{ month: "April", opay: 73, access: 190, zenith: 60 },
	{ month: "May", opay: 209, access: 130, zenith: 110 },
	{ month: "June", opay: 214, access: 140, zenith: 100 },
];

const chartConfig = {
	opay: {
		label: "Opay",
		color: "var(--chart-1)",
	},
	access: {
		label: "Access",
		color: "var(--chart-2)",
	},
	zenith: {
		label: "Zenith",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

export function TransferOverviewChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Sources Transfer Chart</CardTitle>
				<CardDescription>January - June 2026</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 12,
							right: 12,
						}}>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>

						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />

						<Line
							dataKey="opay"
							type="monotone"
							stroke="var(--color-opay)"
							strokeWidth={2}
							dot={false}
						/>

						<Line
							dataKey="access"
							type="monotone"
							stroke="var(--color-access)"
							strokeWidth={2}
							dot={false}
						/>

						<Line
							dataKey="zenith"
							type="monotone"
							stroke="var(--color-zenith)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>

			<CardFooter>
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						<div className="flex items-center gap-2 leading-none font-medium">
							Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
						</div>

						<div className="flex items-center gap-2 leading-none text-muted-foreground">
							Showing total visitors for the last 6 months
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}

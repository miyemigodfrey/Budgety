"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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

export const description = "A linear area chart";

const chartData = [
	{ month: "January", opay: 186, access: 120, zenith: 80 },
	{ month: "February", opay: 305, access: 200, zenith: 140 },
	{ month: "March", opay: 237, access: 150, zenith: 120 },
	{ month: "April", opay: 73, access: 90, zenith: 300 },
	{ month: "May", opay: 209, access: 50, zenith: 130 },
	{ month: "June", opay: 214, access: 290, zenith: 110 },
];

const chartConfig = {
	opay: {
		label: "Opay",
		color: "var(--chart-3)",
	},
	access: {
		label: "Access",
		color: "var(--chart-2)",
	},
	zenith: {
		label: "Zenith",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

export function OutflowOverviewChart() {
	return (
		<Card className="border border-gray-300">
			<CardHeader>
				<CardTitle>Sources Outflow Chart</CardTitle>
				<CardDescription>
					Showing total spending for the last 6 months
				</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={chartData}
						margin={{ left: 12, right: 12 }}>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>

						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" hideLabel />}
						/>

						{Object.entries(chartConfig).map(([key]) => (
							<Area
								key={key}
								dataKey={key}
								type="linear"
								fill={`var(--color-${key})`}
								fillOpacity={0.4}
								stroke={`var(--color-${key})`}
								dot={{
									fill: `var(--color-${key})`,
								}}
								activeDot={{ r: 6 }}
							/>
						))}
					</AreaChart>
				</ChartContainer>
			</CardContent>

			<CardFooter>
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						<div className="flex items-center gap-2 leading-none font-medium">
							Trending up by 5.2% this month
							<TrendingUp className="h-4 w-4" />
						</div>

						<div className="flex items-center gap-2 leading-none text-muted-foreground">
							January - June 2024
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}

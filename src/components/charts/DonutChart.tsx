import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

type DonutChartProps = {
	labels: string[];
	data: number[];
};

export default function DonutChart({ labels, data }: DonutChartProps) {
	const defaultColors = ["#2563EB", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444"];

	const colorsForData = defaultColors
		.slice(0, data.length)
		.concat(
			data.length > defaultColors.length
				? Array.from(
						{ length: data.length - defaultColors.length },
						(_, i) => defaultColors[i % defaultColors.length],
					)
				: [],
		);

	const chartData = {
		labels,
		datasets: [
			{
				data,
				backgroundColor: colorsForData,
				borderWidth: 1,
				borderColor: "#ffffff",
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		cutout: "40%",
		plugins: {
			legend: {
				display: false,
			},
		},
	};

	return (
		<div className="w-full max-w-sm mx-auto p-1.5 flex md:flex-col items-center">
			<div className="w-[50%] md:w-full h-30 sm:h-55 md:h-65 lg:h-80">
				<Doughnut data={chartData} options={options} />
			</div>

			<ul className="mt-4 space-y-2">
				{labels.map((label, idx) => (
					<li key={label} className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-1 md:gap-3">
							<span
								style={{ background: colorsForData[idx] }}
								className="w-2 h-2 rounded-sm inline-block"
							/>
							<span className="text-sm text-gray-700">{label}</span>
						</div>
						<span className="text-sm font-semibold">
							₦{(data[idx] ?? 0).toLocaleString()}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

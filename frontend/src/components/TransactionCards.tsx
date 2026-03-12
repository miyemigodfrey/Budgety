<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
	<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
		<h3 className="text-gray-500 text-sm">Total Balance</h3>
		<p className="text-3xl font-bold mt-2">£12,450</p>
		<p className="text-sm text-gray-500 mt-1">Across all sources</p>
	</div>

	{/* INFLOW SUMMARY */}
	<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
		<h3 className="text-gray-500 text-sm">Total Inflow</h3>
		<p className="text-2xl font-semibold text-green-700 mt-2">+£9,200</p>
		<p className="text-sm text-gray-500 mt-1">This month</p>
	</div>

	{/* OUTFLOW SUMMARY */}
	<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
		<h3 className="text-gray-500 text-sm">Total Outflow</h3>
		<p className="text-2xl font-semibold text-red-700 mt-2">-£4,120</p>
		<p className="text-sm text-gray-500 mt-1">This month</p>
	</div>
</div>;

/** The Budgety wallet-and-coin mark. `id` keeps gradient ids unique per page. */
export function LogoMark({
	id = "lm",
	className = "logo-mark",
	size,
}: {
	id?: string;
	className?: string;
	size?: number;
}) {
	return (
		<svg
			className={className}
			viewBox="0 0 40 40"
			aria-hidden="true"
			style={size ? { width: size, height: size } : undefined}>
			<defs>
				<linearGradient id={`lg-${id}`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#3b82f6" />
					<stop offset="1" stopColor="#1d4ed8" />
				</linearGradient>
			</defs>
			<rect width="40" height="40" rx="11" fill={`url(#lg-${id})`} />
			<circle cx="20" cy="13.5" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.6" />
			<rect x="9.5" y="16" width="21" height="14.5" rx="4" fill="#ffffff" />
			<rect x="22" y="20.6" width="10" height="5.6" rx="2.8" fill="#dbeafe" />
			<circle cx="25" cy="23.4" r="1.5" fill="#ffffff" />
		</svg>
	);
}

/** Decorative rings in the corner of the blue balance card. */
export function HeroRings({ className = "hero-rings" }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 300 300" aria-hidden="true">
			{[148, 110, 72].map((r) => (
				<circle key={r} cx="150" cy="150" r={r} fill="none" stroke="#ffffff" strokeWidth="2" />
			))}
		</svg>
	);
}

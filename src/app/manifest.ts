import type { MetadataRoute } from "next";

/**
 * PWA manifest (served at /manifest.webmanifest). Makes Budgety installable to
 * the home screen as a standalone app. iOS also reads apple-touch-icon and the
 * apple-web-app meta from the root layout.
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Budgety",
		short_name: "Budgety",
		description: "Track your money across purpose-based spaces.",
		start_url: "/dashboard",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: "#eaf1fc",
		theme_color: "#2563eb",
		categories: ["finance", "productivity"],
		icons: [
			{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{
				src: "/icon-maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}

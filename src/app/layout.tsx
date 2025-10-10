import "~/styles/globals.css";

import type { Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { GlobalErrorHandler } from "~/components/GlobalErrorHandler";

export const metadata: Metadata = {
	title: "Neiji",
	description: "The first meditation avaible to everyone",
	icons: [{ rel: "icon", url: "/NeijiHeadLogo1.4.png" }],
	openGraph: {
		title: "Neiji - Meditation for Everyone",
		description: "The first meditation avaible to everyone",
		type: "website",
		url: "https://neiji.co",
		siteName: "Neiji",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Neiji - Meditation App",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Neiji - Meditation for Everyone",
		description: "The first meditation avaible to everyone",
		images: ["/og-image.jpg"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className="font-sans">
				<GlobalErrorHandler />
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}

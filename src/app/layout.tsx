import "~/styles/globals.css";

import type { Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { GlobalErrorHandler } from "~/components/GlobalErrorHandler";

const description =
	"Neiji writes and voices a guided meditation for the day you are having, and helps you turn a few calm minutes into a daily habit.";

export const metadata: Metadata = {
	metadataBase: new URL("https://www.neiji.co"),
	title: {
		default: "Neiji, meditation made for your day",
		template: "%s | Neiji",
	},
	description,
	alternates: { canonical: "/" },
	icons: [{ rel: "icon", url: "/favicon.ico" }],
	openGraph: {
		title: "Neiji, meditation made for your day",
		description,
		type: "website",
		url: "https://www.neiji.co",
		siteName: "Neiji",
		images: [
			{
				url: "/OpenGraph.png",
				width: 1202,
				height: 820,
				alt: "Neiji, a personal meditation coach",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Neiji, meditation made for your day",
		description,
		images: ["/OpenGraph.png"],
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

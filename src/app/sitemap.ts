import type { MetadataRoute } from "next";

const paths = ["", "/chat", "/manifesto", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
	return paths.map((path) => ({
		url: `https://www.neiji.co${path}`,
		changeFrequency: "monthly",
		priority: path === "" ? 1 : 0.6,
	}));
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/protected/", "/auth/", "/admin/"],
			},
		],
		sitemap: "https://www.neiji.co/sitemap.xml",
	};
}

import Link from "next/link";

const links = [
	{ href: "/manifesto", label: "Manifesto" },
	{ href: "/chat", label: "Chat" },
	{ href: "/contact", label: "Contact" },
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
];

export function Footer() {
	return (
		<footer className="border-orange-50/10 border-t bg-[#3D2C17] py-10 text-orange-50">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 sm:px-8 md:flex-row md:justify-between">
				<p className="font-bold font-tt-drugs text-xl">Neiji</p>
				<nav aria-label="Footer">
					<ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
						{links.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									className="text-orange-50/80 transition hover:text-white"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>
				<p className="text-orange-50/60 text-sm">
					&copy; {new Date().getFullYear()} Neiji
				</p>
			</div>
		</footer>
	);
}

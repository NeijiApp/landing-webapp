import { Footer } from "./_components/footer";
import { Hero } from "./_components/hero";
import { HomeManifesto } from "./_components/home-manifesto";
import { MangaSection } from "./_components/manga-section";
import { NewsletterSection } from "./_components/newsletter-section";

export default function Homepage() {
	return (
		<>
			<main>
				<Hero />
				<div id="story" className="scroll-mt-16">
					<MangaSection />
				</div>
				<div id="manifesto" className="scroll-mt-16">
					<HomeManifesto />
				</div>
				<div id="newsletter" className="scroll-mt-16">
					<NewsletterSection />
				</div>
			</main>
			<Footer />
		</>
	);
}

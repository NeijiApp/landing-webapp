"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const navigate = useRouter();

	const handleLogoClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate.push("/");
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<header className="fixed top-0 z-50 w-full border-b border-orange-100/20 bg-white/80 backdrop-blur-xl">
			<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo - Always visible */}
					<a
						href="/"
						onClick={handleLogoClick}
						className="group flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:gap-3"
					>
						<Image
							src="/logo-neiji-full.png"
							alt="Neiji Logo"
							width={620}
							height={403}
							className="h-8 w-auto transition-transform group-hover:rotate-6 sm:h-12"
						/>
						<span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text font-bold text-xl text-transparent sm:text-2xl md:text-3xl">
							Neiji
						</span>
					</a>

					{/* Desktop Navigation */}
					<div className="hidden items-center gap-1 md:flex">
						<Link
							href="/manifesto"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Manifesto
						</Link>
						<Link
							href="/ask"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Chat
						</Link>
						<Link
							href="/contact"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Contact
						</Link>
						<Link
							href="/#newsletter"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Newsletter
						</Link>
						<Link
							href="/chat?signin=true"
							className="ml-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 font-semibold text-sm text-white shadow-sm transition-all hover:shadow-md hover:shadow-orange-200 active:scale-95"
						>
							Sign In
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<button
						type="button"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="rounded-xl p-2 transition-colors hover:bg-orange-50 md:hidden"
						aria-label="Toggle menu"
					>
						{isMenuOpen ? (
							<X className="h-6 w-6 text-orange-600" />
						) : (
							<Menu className="h-6 w-6 text-orange-600" />
						)}
					</button>
				</div>
			</nav>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="overflow-hidden border-t border-orange-100/20 bg-white/95 backdrop-blur-xl md:hidden"
					>
						<nav className="space-y-1 px-4 py-4">
							<Link
								href="/manifesto"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Manifesto
							</Link>
							<Link
								href="/ask"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Chat
							</Link>
							<Link
								href="/contact"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Contact
							</Link>
							<Link
								href="/#newsletter"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Newsletter
							</Link>
							<Link
								href="/chat?signin=true"
								onClick={() => setIsMenuOpen(false)}
								className="mt-2 block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-center font-semibold text-sm text-white shadow-sm transition-all active:scale-95"
							>
								Sign In
							</Link>
						</nav>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl">
            Terms of Service
          </h1>
          <p className="text-gray-600 text-lg">
            Effective date: <strong className="text-orange-600">{new Date().toISOString().slice(0, 10)}</strong>
          </p>
        </div>
      </section>

      {/* Content Section */}
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <div className="prose prose-lg prose-slate max-w-none">
          <div className="rounded-2xl bg-white/60 p-8 shadow-sm backdrop-blur-sm border border-orange-100/20">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the
              services provided by <strong>Neiji</strong> ("we", "us", "our"). By
              accessing or using our website, applications, APIs, or any related
              services (collectively, the "Services"), you agree to be bound by these
              Terms. If you do not agree to these Terms, do not use the Services.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">1. Eligibility</h2>
            <p>
              You must be at least 13 years old (or the minimum age required in your
              jurisdiction) and capable of forming a binding contract to use the
              Services. If you are using the Services on behalf of an organization,
              you represent that you have the authority to accept these Terms on its
              behalf.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">2. Accounts and authentication</h2>
            <p>
              You may need to create an account and authenticate via third-party
              providers (e.g., Google). You are responsible for maintaining the
              confidentiality of your account credentials and for all activities under
              your account. Notify us immediately of any unauthorized use.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">3. Acceptable use</h2>
            <p>You agree not to, and not to allow third parties to:</p>
            <ul>
              <li>Violate any applicable laws or regulations.</li>
              <li>
                Infringe the rights of others, including intellectual property and
                privacy rights.
              </li>
              <li>
                Upload, transmit, or use the Services to store or generate unlawful,
                harmful, hateful, harassing, defamatory, obscene, or otherwise
                objectionable content.
              </li>
              <li>
                Probe, scan, or test the vulnerability of our systems or circumvent
                any security or authentication measures.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Services, including by imposing unreasonable load.
              </li>
              <li>
                Reverse engineer, decompile, or attempt to derive the source code of
                any component of the Services, except as permitted by law.
              </li>
            </ul>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">4. Your content</h2>
            <p>
              You retain ownership of the content you submit to the Services
              ("User Content"). By submitting User Content, you grant us a
              non-exclusive, worldwide, royalty-free license to host, process, store,
              transmit, display, and otherwise use the User Content as necessary to
              provide and improve the Services. You are responsible for ensuring that
              your User Content does not violate these Terms or applicable law.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">5. AI and third-party services</h2>
            <p>
              Certain features may send User Content to third-party AI or speech
              services. By using those features, you instruct us to share only the
              minimum necessary data with such providers to deliver the feature. Your
              use of third-party services may be subject to their terms and policies.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">6. Intellectual property</h2>
            <p>
              We and our licensors retain all right, title, and interest in and to the
              Services, including all software, text, images, audio, and other content
              provided by us, as well as all associated intellectual property rights.
              These Terms do not grant you any rights to our trademarks or other brand
              features.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">7. Feedback</h2>
            <p>
              If you provide feedback, suggestions, or ideas, you grant us a
              perpetual, irrevocable, worldwide, royalty-free license to use and
              incorporate that feedback into the Services without compensation or
              obligation to you.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">8. Beta features</h2>
            <p>
              We may offer experimental or beta features that may be modified or
              discontinued at any time. Such features are provided "as is" without any
              warranties.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">9. Payments and subscriptions</h2>
            <p>
              If paid features are offered, fees, billing cycles, and cancellation
              terms will be presented at checkout or in your account settings. Unless
              otherwise stated, fees are non-refundable except as required by law.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">10. Term and termination</h2>
            <p>
              These Terms remain in effect until terminated. We may suspend or
              terminate your access to the Services at any time, with or without
              notice, if you violate these Terms or if we discontinue the Services.
              Upon termination, your right to use the Services will cease immediately.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">11. Disclaimers</h2>
            <p>
              The Services are provided on an "as is" and "as available" basis.
              To the fullest extent permitted by law, we disclaim all warranties,
              express or implied, including implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement. We do not
              warrant that the Services will be uninterrupted, error-free, or secure.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">12. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, in no event will we be liable
              for any indirect, incidental, special, consequential, or exemplary
              damages, or any loss of profits, revenues, data, or goodwill, arising
              out of or related to your use of the Services, whether based on warranty,
              contract, tort, or any other legal theory, even if we have been advised
              of the possibility of such damages.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from and against any claims,
              liabilities, damages, losses, and expenses (including reasonable
              attorneys' fees) arising out of or in any way connected with your
              violation of these Terms or your misuse of the Services.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">14. Changes to the Services</h2>
            <p>
              We may change or discontinue all or part of the Services at any time,
              with or without notice.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">15. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. We will post the updated
              version on this page and update the effective date above. If changes are
              material, we may provide additional notice as required by law.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">16. Governing law; venue</h2>
            <p>
              These Terms will be governed by the laws applicable in your place of
              incorporation or residence (if acting as a consumer), without regard to
              conflict of laws principles. Venue for disputes will be the courts with
              jurisdiction over our principal place of business, unless mandatory law
              provides otherwise.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">17. Contact</h2>
            <p>
              Questions about these Terms? Contact us at
              <a href="mailto:legal@neiji.co" className="text-orange-600 hover:text-orange-700 font-medium"> legal@neiji.co</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
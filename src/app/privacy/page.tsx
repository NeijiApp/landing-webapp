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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl">
            Privacy Policy
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
              This Privacy Policy explains how <strong>Neiji</strong> ("we", "us", or
              "our") collects, uses, discloses, and safeguards your information when
              you use our website and services (collectively, the "Services"). By
              using the Services, you agree to the collection and use of information
              in accordance with this policy.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">1. Who we are</h2>
            <p>
              Controller: <strong>Neiji</strong>. If you have questions about this
              policy or your data rights, please contact us at
              <a href="mailto:privacy@neiji.co" className="text-orange-600 hover:text-orange-700 font-medium"> privacy@neiji.co</a>.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">2. Information we collect</h2>
            <p>We collect and process the following categories of personal data:</p>
            <ul>
              <li>
                <strong>Account data</strong>: name, email address, authentication
                identifiers (e.g., from Google OAuth), profile image, and your
                preferences.
              </li>
              <li>
                <strong>Usage data</strong>: feature interactions, session metadata,
                device and browser information, approximate location (derived from IP),
                and timestamps.
              </li>
              <li>
                <strong>Content data</strong>: inputs you submit to the Services, such
                as messages, prompts, or files you upload or generate.
              </li>
              <li>
                <strong>Technical logs</strong>: IP address, user agent, error logs,
                and diagnostic information for reliability and security.
              </li>
              <li>
                <strong>Payment data</strong>: if payments are enabled, limited
                billing information processed by our payment provider (we do not store
                full card details on our servers).
              </li>
            </ul>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">3. How we collect data</h2>
            <ul>
              <li>
                <strong>Directly from you</strong> when you create an account, sign in
                with a provider, submit forms, or use interactive features.
              </li>
              <li>
                <strong>Automatically</strong> via cookies, SDKs, and server logs when
                you access the Services.
              </li>
              <li>
                <strong>From third parties</strong> (e.g., authentication providers)
                consistent with your privacy settings with those services.
              </li>
            </ul>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">4. Legal bases for processing (EEA/UK)</h2>
            <p>We process personal data under these legal bases:</p>
            <ul>
              <li><strong>Contract</strong>: to provide and maintain the Services.</li>
              <li>
                <strong>Legitimate interests</strong>: improve and secure the Services,
                prevent abuse, and understand usage.
              </li>
              <li>
                <strong>Consent</strong>: where required (e.g., certain cookies or
                marketing communications). You may withdraw consent at any time.
              </li>
              <li><strong>Legal obligation</strong>: compliance with applicable laws.</li>
            </ul>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">5. How we use your information</h2>
            <ul>
              <li>Provide, operate, and personalize the Services.</li>
              <li>Authenticate users and manage sessions.</li>
              <li>Monitor performance, reliability, and security.</li>
              <li>Research, analyze, and improve features and user experience.</li>
              <li>Communicate with you about updates, support, and policy changes.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">6. Cookies and similar technologies</h2>
            <p>
              We use essential cookies for authentication and session management, and
              may use analytics cookies to understand how the Services are used. You
              can control cookies through your browser settings. Disabling certain
              cookies may impact core functionality.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">7. Data sharing and disclosures</h2>
            <p>
              We share personal data with trusted service providers who process data
              on our behalf, subject to confidentiality and security obligations:
            </p>
            <ul>
              <li>
                <strong>Hosting and storage</strong> (e.g., Supabase/Postgres, object
                storage) to operate databases, authentication, and APIs.
              </li>
              <li>
                <strong>AI/ML partners</strong> (e.g., model or TTS providers) when
                you explicitly use features that send content to such services.
              </li>
              <li>
                <strong>Analytics, monitoring, and logging</strong> for performance and
                reliability.
              </li>
              <li>
                <strong>Payment processors</strong> for billing (where applicable).
              </li>
              <li>
                <strong>Legal and compliance</strong> when required by law or to
                protect rights, safety, and security.
              </li>
            </ul>
            <p>We do not sell personal data.</p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">8. International data transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other
              than your own. Where required, we implement appropriate safeguards, such
              as Standard Contractual Clauses, to protect personal data transferred
              internationally.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">9. Data retention</h2>
            <p>
              We retain personal data only as long as necessary to provide the
              Services, comply with legal obligations, resolve disputes, and enforce
              agreements. Retention periods may vary by data category and use case.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">10. Your rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct,
              delete, or port your personal data, object to or restrict certain
              processing, and withdraw consent. To exercise rights, contact
              <a href="mailto:privacy@neiji.co" className="text-orange-600 hover:text-orange-700 font-medium"> privacy@neiji.co</a>. You may also
              have the right to lodge a complaint with your local data protection
              authority.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">11. Security</h2>
            <p>
              We implement reasonable administrative, technical, and organizational
              measures designed to protect personal data. However, no method of
              transmission or storage is 100% secure, and we cannot guarantee absolute
              security.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">12. Children&apos;s privacy</h2>
            <p>
              Our Services are not directed to children under 13 (or a higher age as
              required by law in your jurisdiction). We do not knowingly collect
              personal data from children. If you believe a child has provided us with
              personal data, please contact us to request deletion.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">13. Third-party links</h2>
            <p>
              The Services may contain links to third-party websites or services. We
              are not responsible for their privacy practices. We encourage you to
              review the privacy policies of any third-party sites you visit.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">14. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the
              updated version on this page and update the effective date above. If
              changes are material, we may provide additional notice as required.
            </p>

            <h2 className="text-orange-600 text-2xl font-semibold mt-8 mb-4 border-b border-orange-100 pb-2">15. Contact us</h2>
            <p>
              If you have questions or requests regarding this policy, contact
              <a href="mailto:privacy@neiji.co" className="text-orange-600 hover:text-orange-700 font-medium"> privacy@neiji.co</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
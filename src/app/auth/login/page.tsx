/**
 * Login page for user authentication
 *
 * This page allows existing users to sign in to their account
 * using their email and password. After successful authentication,
 * the user is redirected to the protected area of the application.
 *
 * Features:
 * - Login form with validation
 * - Authentication error handling
 * - Automatic redirection after login
 * - Link to signup page
 *
 * @component
 * @example
 * // Used automatically by Next.js for the /auth/login route
 * <LoginPage />
 */
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/auth");
}

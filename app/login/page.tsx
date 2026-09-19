import { LoginForm } from "@/components/auth/LoginForm";

// A server component so it can read ?registered=1 (set when sign-up succeeded
// but the automatic sign-in did not) without useSearchParams, which would
// force a Suspense boundary around the client form.

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { registered } = await searchParams;
  return <LoginForm justRegistered={registered === "1"} />;
}

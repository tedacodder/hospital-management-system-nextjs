import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata = { title: "Access denied" };

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <LogoMark className="h-10 w-10 text-sm" />
      <p className="mt-6 font-mono text-xs font-medium uppercase tracking-wider text-ink-500">403</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
        You don&rsquo;t have access to this page
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
        Your account role doesn&rsquo;t permit viewing this area. If you think this is a mistake, contact your
        administrator.
      </p>
      <ButtonLink href="/" size="lg" className="mt-6">
        Back to home
      </ButtonLink>
    </main>
  );
}

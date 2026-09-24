import { LogoMark } from "@/components/brand/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper" role="status">
      <LogoMark className="h-10 w-10 text-sm" />
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-accent-700 border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-accent-700 border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

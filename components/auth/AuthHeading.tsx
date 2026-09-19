/// The title block at the top of an auth card. Each form renders its own so
/// the sign-up form can replace it with the success state.
export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">{title}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{description}</p>
    </div>
  );
}

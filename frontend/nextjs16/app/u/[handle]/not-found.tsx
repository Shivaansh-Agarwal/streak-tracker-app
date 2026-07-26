export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold">Profile not found</h1>
      <p className="text-muted">This user doesn&apos;t exist.</p>
    </div>
  );
}

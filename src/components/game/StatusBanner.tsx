type StatusBannerProps = {
  message: string;
  currentScore: number;
  bestScore: number;
};

export function StatusBanner({
  message,
  currentScore,
  bestScore,
}: StatusBannerProps) {
  if (!message && currentScore === 0 && bestScore === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm text-gray-700 shadow-sm">
      <p>{message || "Keep the streak alive."}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">
        Current streak: {currentScore} | Session best: {bestScore}
      </p>
    </div>
  );
}

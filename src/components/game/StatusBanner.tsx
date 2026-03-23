type StatusBannerProps = {
  message: string;
};

export function StatusBanner({ message }: StatusBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm text-gray-700 shadow-sm">
      {message}
    </div>
  );
}

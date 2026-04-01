import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../../api/leaderboard";
import type { LeaderboardEntry } from "./types";

type LeaderboardProps = {
  refreshKey: number;
};

export function Leaderboard({ refreshKey }: LeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchLeaderboard();

        if (!isMounted) {
          return;
        }

        setRows(data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch leaderboard.";

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return (
    <aside className="fixed bottom-4 left-4 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-300 bg-white/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Hall of Fame
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-gray-600">Loading leaderboard...</p> : null}
      {!isLoading && errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
      {!isLoading && !errorMessage && rows.length === 0 ? (
        <p className="text-sm text-gray-600">No scores saved yet.</p>
      ) : null}
      {!isLoading && !errorMessage && rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {index + 1}. {row.name}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(row.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="ml-3 text-lg font-bold text-gray-900">{row.score}</p>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

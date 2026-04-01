import type { LeaderboardEntry } from "../components/game/types";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:3000";

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${BACKEND_URL}/leaderboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard.");
  }

  return (await response.json()) as LeaderboardEntry[];
}

export async function saveScore(name: string, score: number) {
  const response = await fetch(`${BACKEND_URL}/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      score,
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(data?.error || "Failed to save score.");
  }

  return response.json();
}

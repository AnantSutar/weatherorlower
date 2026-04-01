import { useEffect, useState } from "react";
import { saveScore } from "./api/leaderboard";
import { createInitialMatchup, createNextCity } from "./api/weather";
import { Button } from "./components/ui/button";
import { CityCard } from "./components/game/CityCard";
import { GameHeader } from "./components/game/GameHeader";
import { GameOverDialog } from "./components/game/GameOverDialog";
import { GuessControls } from "./components/game/GuessControls";
import { InstructionsDialog } from "./components/game/InstructionsDialog";
import { Leaderboard } from "./components/game/Leaderboard";
import { StatusBanner } from "./components/game/StatusBanner";
import type { City, Guess } from "./components/game/types";
import { replaceProfanities } from 'no-profanity';
const INSTRUCTIONS_SEEN_KEY = "weather-higher-or-lower.instructions-seen";

function App() {
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [nextCity, setNextCity] = useState<City | null>(null);
  const [score, setScore] = useState(0);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isLoadingNextCity, setIsLoadingNextCity] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [sessionBestScore, setSessionBestScore] = useState(0);
  const [savedBestScore, setSavedBestScore] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  const hasApiKey = typeof apiKey === "string" && apiKey.trim().length > 0;
  const isBusy = isLoadingGame || isLoadingNextCity;
  const isModalOpen = showInstructions || showGameOver;

  const resetRunUiState = () => {
    setStatusMessage("");
    setHasError(false);
  };

  const loadGame = async () => {
    if (!hasApiKey) {
      setCurrentCity(null);
      setNextCity(null);
      setStatusMessage("Add your Weather API key to start the game.");
      setHasError(true);
      setIsLoadingGame(false);
      return;
    }

    setIsLoadingGame(true);
    resetRunUiState();

    try {
      const { currentCity, nextCity } = await createInitialMatchup(apiKey);

      setCurrentCity(currentCity);
      setNextCity(nextCity);
      setScore(0);
      setSaveError("");
      setSaveSuccessMessage("");
      setHasError(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't start the game.";

      setCurrentCity(null);
      setNextCity(null);
      setStatusMessage(message);
      setHasError(true);
    } finally {
      setIsLoadingGame(false);
    }
  };

  const loadNextCity = async (baseCity: City) => {
    setIsLoadingNextCity(true);
    resetRunUiState();

    try {
      const newCity = await createNextCity(apiKey, baseCity);
      setNextCity(newCity);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't load the next city.";

      setStatusMessage(message);
      setNextCity(null);
      setHasError(true);
    } finally {
      setIsLoadingNextCity(false);
    }
  };

  useEffect(() => {
    const hasSeenInstructions = window.localStorage.getItem(
      INSTRUCTIONS_SEEN_KEY,
    );

    if (!hasSeenInstructions) {
      setShowInstructions(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!hasApiKey) {
        setStatusMessage("Add your Weather API key to start the game.");
        setHasError(true);
        setIsLoadingGame(false);
        return;
      }

      setIsLoadingGame(true);
      resetRunUiState();

      try {
        const { currentCity, nextCity } = await createInitialMatchup(apiKey);

        if (!isMounted) {
          return;
        }

        setCurrentCity(currentCity);
        setNextCity(nextCity);
        setScore(0);
        setSaveError("");
        setSaveSuccessMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Couldn't start the game.";

        setCurrentCity(null);
        setNextCity(null);
        setStatusMessage(message);
        setHasError(true);
      } finally {
        if (isMounted) {
          setIsLoadingGame(false);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [hasApiKey]);

  const handleGuess = async (guess: Guess) => {
    if (!currentCity || !nextCity || isBusy || isModalOpen) {
      return;
    }

    const isHigher = nextCity.temp > currentCity.temp;
    const isEqual = nextCity.temp === currentCity.temp;
    const correct =
      isEqual ||
      (guess === "higher" && isHigher) ||
      (guess === "lower" && !isHigher);

    if (!correct) {
      setLastScore(score);
      setSessionBestScore((currentBestScore) =>
        Math.max(currentBestScore, score),
      );
      setShowGameOver(true);
      return;
    }

    setCurrentCity(nextCity);
    setScore((currentScore) => {
      const nextScore = currentScore + 1;
      setSessionBestScore((currentBestScore) =>
        Math.max(currentBestScore, nextScore),
      );
      return nextScore;
    });

    if (isEqual) {
      setStatusMessage("Tie on temperature. The round still counts.");
      setHasError(false);
    }

    await loadNextCity(nextCity);
  };

  const handleInstructionsChange = (open: boolean) => {
    setShowInstructions(open);

    if (!open) {
      window.localStorage.setItem(INSTRUCTIONS_SEEN_KEY, "true");
    }
  };

  const handleRestartGame = async () => {
    setShowGameOver(false);
    await loadGame();
  };

  const handleSaveBestScore = async (name: string) => {
    if (sessionBestScore <= 0 || savedBestScore === sessionBestScore) {
      return;
    }

    setIsSavingScore(true);
    setSaveError("");
    setSaveSuccessMessage("");

    try {
      await saveScore(name, sessionBestScore);

      setSavedBestScore(sessionBestScore);
      setSaveSuccessMessage("Best score saved to the leaderboard.");
      setLeaderboardRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save score.";

      setSaveError(message);
    } finally {
      setIsSavingScore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <Leaderboard refreshKey={leaderboardRefreshKey} />
      <InstructionsDialog
        open={showInstructions}
        onOpenChange={handleInstructionsChange}
        closeLabel="Start Playing"
      />
      <GameOverDialog
        open={showGameOver}
        score={lastScore}
        bestScore={sessionBestScore}
        canSaveBestScore={sessionBestScore > 0 && savedBestScore !== sessionBestScore}
        isSaving={isSavingScore}
        saveError={saveError}
        saveSuccessMessage={saveSuccessMessage}
        onSaveBestScore={handleSaveBestScore}
        onPlayAgain={() => void handleRestartGame()}
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <GameHeader bestScore={sessionBestScore} />
        <StatusBanner
          message={statusMessage}
          currentScore={score}
          bestScore={sessionBestScore}
        />

        <div className="flex flex-col items-center gap-8 lg:flex-row">
          <CityCard
            city={currentCity}
            label="Current"
            temperatureLabel={
              currentCity ? `${currentCity.temp} degrees C` : "--"
            }
            emptyLabel="Loading city..."
          />
          <GuessControls
            disabled={!currentCity || !nextCity || isBusy}
            isBusy={isBusy}
            onGuess={(guess) => void handleGuess(guess)}
          />
          <CityCard
            city={nextCity}
            label="Next"
            temperatureLabel="???"
            emptyLabel={
              isLoadingGame || isLoadingNextCity
                ? "Loading city..."
                : "No city available"
            }
          />
        </div>

        {hasError && hasApiKey ? (
          <Button variant="outline" onClick={() => void loadGame()}>
            Restart Game
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default App;

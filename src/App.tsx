import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { CityCard } from "./components/game/CityCard";
import { GameHeader } from "./components/game/GameHeader";
import { GameOverDialog } from "./components/game/GameOverDialog";
import { GuessControls } from "./components/game/GuessControls";
import { InstructionsDialog } from "./components/game/InstructionsDialog";
import { StatusBanner } from "./components/game/StatusBanner";
import type { City, Guess } from "./components/game/types";

const RANDOM_CITY_URL = "https://random-city-api.vercel.app/api/random-city";
const MAX_CITY_ATTEMPTS = 8;
const INSTRUCTIONS_SEEN_KEY = "weather-higher-or-lower.instructions-seen";

const getCityKey = (city: City) =>
  `${city.name.trim().toLowerCase()}-${city.country.trim().toLowerCase()}`;

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

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  const hasApiKey = typeof apiKey === "string" && apiKey.trim().length > 0;
  const isBusy = isLoadingGame || isLoadingNextCity;
  const isModalOpen = showInstructions || showGameOver;

  const fetchCityName = async (): Promise<string> => {
    const res = await fetch(RANDOM_CITY_URL);

    if (!res.ok) {
      throw new Error("Couldn't fetch a random city.");
    }

    const data = (await res.json()) as { city?: unknown };
    const rawCity = typeof data.city === "string" ? data.city.trim() : "";

    if (!rawCity) {
      throw new Error("Random city service returned invalid data.");
    }

    try {
      return decodeURIComponent(rawCity);
    } catch {
      return rawCity;
    }
  };

  const fetchWeather = async (city: string): Promise<City | null> => {
    if (!hasApiKey) {
      throw new Error("Missing VITE_WEATHER_API_KEY.");
    }

    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`,
    );

    const data = (await res.json()) as {
      error?: { message?: string };
      location?: { country?: unknown; name?: unknown };
      current?: { temp_c?: unknown; condition?: { icon?: unknown } };
    };

    if (!res.ok) {
      const isMissingCity =
        typeof data.error?.message === "string" &&
        data.error.message.toLowerCase().includes("no matching location found");

      if (isMissingCity) {
        return null;
      }

      throw new Error("Weather service is unavailable right now.");
    }

    if (data.error) {
      return null;
    }

    const name =
      typeof data.location?.name === "string" ? data.location.name.trim() : "";
    const country =
      typeof data.location?.country === "string"
        ? data.location.country.trim()
        : "";
    const temp =
      typeof data.current?.temp_c === "number" ? data.current.temp_c : null;
    const icon =
      typeof data.current?.condition?.icon === "string"
        ? data.current.condition.icon
        : "";

    if (!name || !country || temp === null) {
      return null;
    }

    const normalizedIcon = icon
      ? icon.startsWith("//")
        ? `https:${icon}`
        : icon
      : "";

    return {
      name,
      country,
      temp,
      img: normalizedIcon,
    };
  };

  const buildCity = async (excludedKeys: string[] = []): Promise<City> => {
    const blockedKeys = new Set(excludedKeys);

    for (let attempt = 0; attempt < MAX_CITY_ATTEMPTS; attempt += 1) {
      const rawCity = await fetchCityName();
      const weather = await fetchWeather(rawCity);

      if (!weather) {
        continue;
      }

      if (blockedKeys.has(getCityKey(weather))) {
        continue;
      }

      return weather;
    }

    throw new Error("Couldn't find a valid city matchup. Please try again.");
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
    setStatusMessage("");
    setHasError(false);

    try {
      const cityA = await buildCity();
      const cityB = await buildCity([getCityKey(cityA)]);

      setCurrentCity(cityA);
      setNextCity(cityB);
      setScore(0);
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
    setStatusMessage("");
    setHasError(false);

    try {
      const newCity = await buildCity([getCityKey(baseCity)]);
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
      setStatusMessage("");
      setHasError(false);

      try {
        const cityA = await buildCity();
        const cityB = await buildCity([getCityKey(cityA)]);

        if (!isMounted) {
          return;
        }

        setCurrentCity(cityA);
        setNextCity(cityB);
        setScore(0);
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
      setShowGameOver(true);
      return;
    }

    setCurrentCity(nextCity);
    setScore((currentScore) => currentScore + 1);

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

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <InstructionsDialog
        open={showInstructions}
        onOpenChange={handleInstructionsChange}
        closeLabel="Start Playing"
      />
      <GameOverDialog
        open={showGameOver}
        score={lastScore}
        onPlayAgain={() => void handleRestartGame()}
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <GameHeader score={score} />
        <StatusBanner message={statusMessage} />

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

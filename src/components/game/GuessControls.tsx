import { Button } from "../ui/button";
import type { Guess } from "./types";

type GuessControlsProps = {
  disabled: boolean;
  isBusy: boolean;
  onGuess: (guess: Guess) => void;
};

export function GuessControls({
  disabled,
  isBusy,
  onGuess,
}: GuessControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-2xl font-semibold text-gray-600">VS</span>

      <div className="flex gap-2">
        <Button disabled={disabled} onClick={() => onGuess("higher")}>
          Higher
        </Button>
        <Button disabled={disabled} onClick={() => onGuess("lower")}>
          Lower
        </Button>
      </div>

      {isBusy ? (
        <p className="text-sm text-gray-500">Loading matchup...</p>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type GameOverDialogProps = {
  open: boolean;
  score: number;
  bestScore: number;
  canSaveBestScore: boolean;
  isSaving: boolean;
  saveError: string;
  saveSuccessMessage: string;
  onSaveBestScore: (name: string) => Promise<void>;
  onPlayAgain: () => void;
};

export function GameOverDialog({
  open,
  score,
  bestScore,
  canSaveBestScore,
  isSaving,
  saveError,
  saveSuccessMessage,
  onSaveBestScore,
  onPlayAgain,
}: GameOverDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
  }, [open]);

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || !canSaveBestScore || isSaving) {
      return;
    }

    await onSaveBestScore(trimmedName);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          return;
        }
      }}
    >
      <DialogContent
        className="border-red-100 bg-white sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Game over</DialogTitle>
          <DialogDescription>
            Your run ended when the next city didn&apos;t match your guess.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-red-50 px-4 py-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-red-500">
            Final score
          </p>
          <p className="mt-2 text-4xl font-bold text-red-950">{score}</p>
          <p className="mt-3 text-sm text-red-700">
            Highest score this session:{" "}
            <span className="font-semibold text-red-950">{bestScore}</span>
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Save your best score</p>
            <p className="text-sm text-gray-600">
              Enter a name to save your highest score from this session.
            </p>
          </div>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500"
            maxLength={30}
            disabled={!canSaveBestScore || isSaving}
          />

          {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
          {!saveError && saveSuccessMessage ? (
            <p className="text-sm text-green-700">{saveSuccessMessage}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => void handleSave()}
            disabled={!name.trim() || !canSaveBestScore || isSaving}
          >
            {isSaving ? "Saving..." : "Save Best Score"}
          </Button>
          <Button onClick={onPlayAgain}>Play Again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

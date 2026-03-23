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
  onPlayAgain: () => void;
};

export function GameOverDialog({
  open,
  score,
  onPlayAgain,
}: GameOverDialogProps) {
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
        </div>

        <DialogFooter>
          <Button onClick={onPlayAgain}>Play Again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

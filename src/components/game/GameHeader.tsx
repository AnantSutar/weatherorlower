import { InstructionsDialog } from "./InstructionsDialog";

type GameHeaderProps = {
  bestScore: number;
};

export function GameHeader({ bestScore }: GameHeaderProps) {
  return (
    <div className="flex w-full max-w-2xl items-center justify-between gap-4">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Best This Session
        </p>
        <p className="text-4xl font-bold text-gray-900">{bestScore}</p>
      </div>

      <InstructionsDialog
        showTrigger
        closeLabel="Back to Game"
        description="Quick refresher before your next streak."
      />
    </div>
  );
}

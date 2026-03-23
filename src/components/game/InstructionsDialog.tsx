import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type InstructionsDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  title?: string;
  description?: string;
  closeLabel: string;
  showTrigger?: boolean;
};

function InstructionsBody() {
  return (
    <div className="space-y-3 text-sm text-gray-700">
      <p>
        You can always see the current city&apos;s temperature, but the next city
        stays hidden until after your guess.
      </p>
      <p>
        Every correct answer moves the next city into the current slot and adds
        1 point to your score.
      </p>
      <p>
        Invalid city results are skipped automatically, and exact temperature
        ties still count as correct.
      </p>
    </div>
  );
}

export function InstructionsDialog({
  open,
  onOpenChange,
  triggerLabel = "Instructions",
  title = "How to play",
  description = "Compare the next city against the current one and guess whether its temperature is higher or lower.",
  closeLabel,
  showTrigger = false,
}: InstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button variant="outline">{triggerLabel}</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="border-sky-100 bg-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <InstructionsBody />

        <DialogFooter>
          <DialogClose asChild>
            <Button>{closeLabel}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

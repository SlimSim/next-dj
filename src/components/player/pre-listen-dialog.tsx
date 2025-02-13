import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

interface PreListenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onDisable: () => void;
  onConfigureOutput: () => void;
}

export function PreListenDialog({
  isOpen,
  onClose,
  onContinue,
  onDisable,
  onConfigureOutput,
}: PreListenDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pre-Listen Output Warning</DialogTitle>
          <DialogDescription>
            The pre-listen output is set to the same device as your main output.
            This could interrupt your main mix.
          </DialogDescription>
          <DialogDescription>
            You can configure the pre-listen output or disable pre-listen in the
            settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button
            onClick={onConfigureOutput}
            variant="default"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure Different Output
          </Button>
          <Button onClick={onContinue} variant="outline">
            Continue Anyway
          </Button>
          <Button onClick={onDisable} variant="ghost">
            Disable Pre-Listen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import * as Evolu from "@evolu/common";
import { useEffect, useState, type FormEvent } from "react";
import { useEvolu } from "~/evolu";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

const onboardingStorageKey = "invoice:evolu-recovery-onboarding-complete";

type AppOwnerWithMnemonic = {
  mnemonic?: string | null;
};

function getOwnerMnemonic(owner: unknown): string {
  const mnemonic = (owner as AppOwnerWithMnemonic | null)?.mnemonic;

  return typeof mnemonic === "string" ? mnemonic : "";
}

export function RecoveryPhraseOnboardingDialog() {
  const evolu = useEvolu();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"generated" | "restore">("generated");
  const [isPhraseRevealed, setIsPhraseRevealed] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [restoreMnemonic, setRestoreMnemonic] = useState("");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setOpen(localStorage.getItem(onboardingStorageKey) !== "true");

    evolu.appOwner.then((owner) => {
      if (!cancelled) setMnemonic(getOwnerMnemonic(owner));
    });

    return () => {
      cancelled = true;
    };
  }, [evolu]);

  const completeOnboarding = () => {
    localStorage.setItem(onboardingStorageKey, "true");
    setOpen(false);
  };

  const handleCopy = async () => {
    if (!mnemonic) return;

    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const handleRestore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMnemonic = restoreMnemonic.trim();
    if (!trimmedMnemonic) {
      setRestoreError("Vložte obnovovací frázi.");
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const mnemonic = Evolu.Mnemonic.orThrow(trimmedMnemonic);
      await evolu.restoreAppOwner(mnemonic, { reload: false });
      completeOnboarding();
      window.location.reload();
    } catch {
      setRestoreError(
        "Frázi se nepodařilo obnovit. Zkontrolujte ji a zkuste to znovu.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      completeOnboarding();
      return;
    }

    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden border-border/70 p-0 sm:max-w-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="overflow-hidden p-6 pt-10">
          <div className="grid gap-5">
            <DialogHeader>
              <DialogTitle className="text-2xl leading-tight">
                Záloha a obnova faktur
              </DialogTitle>
              <DialogDescription>
                Uložte si obnovovací frázi. Bez ní nepůjde faktury obnovit na
                jiném zařízení.
              </DialogDescription>
            </DialogHeader>

            <div
              className={cn(
                "grid w-[200%] transition-transform duration-250 ease-[cubic-bezier(0.645,0.045,0.355,1)] motion-reduce:transition-none",
                mode === "restore" ? "-translate-x-1/2" : "translate-x-0",
              )}
              style={{ gridTemplateColumns: "50% 50%" }}
            >
              <section
                className={cn(
                  "grid gap-4 pr-6 transition-opacity duration-200 ease-out motion-reduce:transition-none",
                  mode === "restore" && "pointer-events-none opacity-0",
                )}
                inert={mode === "restore"}
              >
                <div className="grid gap-1">
                  <p className="text-sm font-medium">Nová obnovovací fráze</p>
                </div>
                <div className="relative overflow-hidden rounded-lg border bg-background/80">
                  <div
                    id="generated-recovery-phrase"
                    className={cn(
                      "min-h-28 whitespace-pre-wrap p-4 font-mono text-sm leading-6 transition-[filter,opacity,transform] duration-[250ms] ease-out motion-reduce:transition-none",
                      isPhraseRevealed
                        ? "translate-y-0 opacity-100 blur-0"
                        : "translate-y-1 opacity-80 blur-md select-none",
                    )}
                    aria-label="Nová obnovovací fráze"
                  >
                    {mnemonic || "Generuji obnovovací frázi..."}
                  </div>
                  {!isPhraseRevealed ? (
                    <div className="absolute inset-0 grid place-items-center bg-background/35 backdrop-blur-[2px] motion-reduce:backdrop-blur-none">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsPhraseRevealed(true)}
                        disabled={!mnemonic}
                      >
                        Zobrazit frázi
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={completeOnboarding}
                    disabled={!mnemonic}
                  >
                    Mám bezpečně uloženo
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    variant="secondary"
                    onClick={handleCopy}
                    disabled={!mnemonic}
                  >
                    {copyState === "copied"
                      ? "Zkopírováno"
                      : copyState === "failed"
                        ? "Zkopírujte ručně"
                        : "Kopírovat frázi"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("restore")}
                >
                  Mám vlastní frázi
                </Button>
              </section>

              <form
                className={cn(
                  "grid gap-4 transition-opacity duration-200 ease-out motion-reduce:transition-none",
                  mode === "generated" && "pointer-events-none opacity-0",
                )}
                onSubmit={handleRestore}
                inert={mode === "generated"}
              >
                <div className="grid gap-1">
                  <Label htmlFor="restore-recovery-phrase">
                    Obnovit existující data
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Vložte frázi z jiného počítače. Aktuální nový profil bude
                    nahrazen obnoveným profilem.
                  </p>
                </div>
                <Textarea
                  id="restore-recovery-phrase"
                  value={restoreMnemonic}
                  onChange={(event) => setRestoreMnemonic(event.target.value)}
                  placeholder="Vložte obnovovací frázi"
                  className="min-h-20 resize-none font-mono text-sm"
                />
                {restoreError ? (
                  <p className="text-sm text-destructive">{restoreError}</p>
                ) : null}
                <DialogFooter className="grid sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setMode("generated")}
                  >
                    Zpět
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isRestoring}
                  >
                    {isRestoring ? "Obnovuji..." : "Obnovit a synchronizovat"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

const onboardingStorageKey = "invoice:evolu-recovery-onboarding-complete";

type AppOwnerWithMnemonic = {
  mnemonic?: string | null;
};

function getOwnerMnemonic(owner: unknown) {
  return typeof (owner as AppOwnerWithMnemonic | null)?.mnemonic === "string"
    ? (owner as AppOwnerWithMnemonic).mnemonic
    : "";
}

export function RecoveryPhraseOnboardingDialog() {
  const evolu = useEvolu();
  const [open, setOpen] = useState(false);
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
      setRestoreError("Frázi se nepodařilo obnovit. Zkontrolujte ji a zkuste to znovu.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="overflow-hidden border-border/70 p-0 sm:max-w-2xl"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden border-b bg-muted/40 p-6 md:border-r md:border-b-0">
            <div className="absolute -top-16 -left-16 size-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative grid gap-4">
              <div className="inline-flex w-fit rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                Synchronizace přes Evolu
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl leading-tight">
                  Záloha a obnova faktur
                </DialogTitle>
                <DialogDescription>
                  Evolu vytvořilo obnovovací frázi pro šifrovanou synchronizaci
                  mezi zařízeními. Uložte ji bezpečně, nebo obnovte existující
                  data vložením své fráze.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border bg-background/70 p-3 text-sm text-muted-foreground">
                Relay uchovává jen šifrované změny. Bez fráze nepůjde faktury
                obnovit na jiném počítači.
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6">
            <section className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="generated-recovery-phrase">
                  Nová obnovovací fráze
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toto je fráze pro tento nový profil. Uložte ji do správce
                  hesel nebo na bezpečné místo.
                </p>
              </div>
              <Textarea
                id="generated-recovery-phrase"
                value={mnemonic || "Generuji obnovovací frázi..."}
                readOnly
                className="min-h-24 resize-none font-mono text-sm"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleCopy} disabled={!mnemonic}>
                  {copyState === "copied"
                    ? "Zkopírováno"
                    : copyState === "failed"
                      ? "Zkopírujte ručně"
                      : "Kopírovat frázi"}
                </Button>
                <Button type="button" onClick={completeOnboarding} disabled={!mnemonic}>
                  Mám bezpečně uloženo
                </Button>
              </div>
            </section>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <div className="h-px bg-border" />
              nebo
              <div className="h-px bg-border" />
            </div>

            <form className="grid gap-3" onSubmit={handleRestore}>
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
              <DialogFooter>
                <Button type="submit" disabled={isRestoring}>
                  {isRestoring ? "Obnovuji..." : "Obnovit a synchronizovat"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

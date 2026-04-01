import * as Evolu from "@evolu/common";
import { useQuery } from "@evolu/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, FileText, Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { evolu, useEvolu } from "~/evolu";

const allProjects = evolu.createQuery((db) =>
  db
    .selectFrom("project")
    .selectAll()
    .where("isDeleted", "is", null)
    .orderBy("createdAt", "desc"),
);

const vatModeOptions = [
  { value: "standard", label: "Standardní DPH" },
  { value: "reverse-charge", label: "Přenesená daňová povinnost" },
  { value: "none", label: "Bez DPH" },
] as const;

const currencyOptions = ["CZK", "EUR", "USD"] as const;

function getEffectiveVatMode(
  vatMode: (typeof vatModeOptions)[number]["value"],
  isVatPayer: ProjectFormValues["isVatPayer"],
): (typeof vatModeOptions)[number]["value"] {
  return isVatPayer === "true" ? vatMode : "none";
}

type ProjectFormValues = {
  name: string;
  companyName: string;
  ico: string;
  dic: string;
  vatId: string;
  vatMode: (typeof vatModeOptions)[number]["value"];
  isVatPayer: "true" | "false";
  street: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  bankAccount: string;
  iban: string;
  swift: string;
  defaultCurrency: (typeof currencyOptions)[number];
  note: string;
};

const emptyProjectFormValues: ProjectFormValues = {
  name: "",
  companyName: "",
  ico: "",
  dic: "",
  vatId: "",
  vatMode: "standard",
  isVatPayer: "false",
  street: "",
  city: "",
  postalCode: "",
  country: "",
  email: "",
  phone: "",
  website: "",
  bankAccount: "",
  iban: "",
  swift: "",
  defaultCurrency: "CZK",
  note: "",
};

export const Route = createFileRoute("/")({ component: App });

function vatModeLabel(mode: string | null) {
  return vatModeOptions.find((option) => option.value === mode)?.label ?? "";
}

function toOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function getProjectFormValues(
  project?: Record<string, any> | null,
): ProjectFormValues {
  if (!project) return emptyProjectFormValues;

  const currency = currencyOptions.includes(project.defaultCurrency)
    ? project.defaultCurrency
    : "CZK";
  const vatMode = vatModeOptions.some(
    (option) => option.value === project.vatMode,
  )
    ? project.vatMode
    : "standard";
  const isVatPayer = project.isVatPayer ? "true" : "false";

  return {
    name: project.name ?? "",
    companyName: project.companyName ?? "",
    ico: project.ico ?? "",
    dic: project.dic ?? "",
    vatId: project.vatId ?? "",
    vatMode: getEffectiveVatMode(vatMode, isVatPayer),
    isVatPayer,
    street: project.street ?? "",
    city: project.city ?? "",
    postalCode: project.postalCode ?? "",
    country: project.country ?? "",
    email: project.email ?? "",
    phone: project.phone ?? "",
    website: project.website ?? "",
    bankAccount: project.bankAccount ?? "",
    iban: project.iban ?? "",
    swift: project.swift ?? "",
    defaultCurrency: currency,
    note: project.note ?? "",
  };
}

function ProjectDialog({
  open,
  onOpenChange,
  mode,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: Record<string, any> | null;
}) {
  const { insert, update } = useEvolu();
  const [values, setValues] = useState<ProjectFormValues>(() =>
    getProjectFormValues(project),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(getProjectFormValues(project));
    setSaveError(null);
  }, [open, project]);

  const isEditing = mode === "edit";

  const handleFieldChange = <K extends keyof ProjectFormValues>(
    field: K,
    value: ProjectFormValues[K],
  ) => {
    setValues((current) => {
      const nextValues = { ...current, [field]: value };

      if (field === "isVatPayer") {
        nextValues.vatMode = getEffectiveVatMode(
          current.vatMode,
          value as ProjectFormValues["isVatPayer"],
        );
      }

      return nextValues;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);

    const parsedName = Evolu.NonEmptyString100.from(values.name.trim());
    const parsedCompanyName = Evolu.NonEmptyString100.from(
      values.companyName.trim(),
    );

    if (!parsedName.ok || !parsedCompanyName.ok) {
      setSaveError("Vyplňte název projektu a obchodní jméno.");
      return;
    }

    const payload = {
      ...(isEditing ? { id: project?.id } : {}),
      name: parsedName.value,
      companyName: parsedCompanyName.value,
      ico: toOptionalValue(values.ico),
      dic: toOptionalValue(values.dic),
      vatId: toOptionalValue(values.vatId),
      vatMode: getEffectiveVatMode(values.vatMode, values.isVatPayer),
      isVatPayer:
        values.isVatPayer === "true" ? Evolu.sqliteTrue : Evolu.sqliteFalse,
      street: toOptionalValue(values.street),
      city: toOptionalValue(values.city),
      postalCode: toOptionalValue(values.postalCode),
      country: toOptionalValue(values.country),
      email: toOptionalValue(values.email),
      phone: toOptionalValue(values.phone),
      website: toOptionalValue(values.website),
      bankAccount: toOptionalValue(values.bankAccount),
      iban: toOptionalValue(values.iban)?.toUpperCase() ?? null,
      swift: toOptionalValue(values.swift)?.toUpperCase() ?? null,
      defaultCurrency: values.defaultCurrency as Evolu.CurrencyCode,
      note: toOptionalValue(values.note),
    } as any;

    const result = isEditing
      ? update("project", payload)
      : insert("project", payload);

    if (!result.ok) {
      setSaveError(
        "Projekt se nepodařilo uložit. Zkontrolujte formát vyplněných hodnot.",
      );
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEditing ? "Upravit projekt" : "Nový projekt"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Změňte fakturační a firemní údaje projektu."
              : "Vytvořte projekt a nastavte základní fakturační údaje."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {saveError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-base font-semibold">Základ</h3>
                <p className="text-sm text-muted-foreground">
                  Identita projektu a základní fakturační nastavení.
                </p>
              </div>

              <div className="grid gap-4">
                <ProjectInput
                  label="Název projektu"
                  required
                  value={values.name}
                  onChange={(value) => handleFieldChange("name", value)}
                  placeholder="Například Webdesign 2026"
                />
                <ProjectInput
                  label="Obchodní jméno"
                  required
                  value={values.companyName}
                  onChange={(value) => handleFieldChange("companyName", value)}
                  placeholder="Firma nebo OSVČ"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectInput
                    label="IČO"
                    value={values.ico}
                    onChange={(value) => handleFieldChange("ico", value)}
                    placeholder="12345678"
                    className="font-mono"
                  />
                  <ProjectInput
                    label="DIČ"
                    value={values.dic}
                    onChange={(value) => handleFieldChange("dic", value)}
                    placeholder="CZ12345678"
                    className="font-mono"
                  />
                </div>
                <ProjectInput
                  label="VAT ID"
                  value={values.vatId}
                  onChange={(value) => handleFieldChange("vatId", value)}
                  placeholder="Napriklad CZ12345678"
                  className="font-mono"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectSelect
                    label="Plátce DPH"
                    value={values.isVatPayer}
                    onValueChange={(value) =>
                      handleFieldChange(
                        "isVatPayer",
                        value as ProjectFormValues["isVatPayer"],
                      )
                    }
                    options={[
                      { value: "false", label: "Ne" },
                      { value: "true", label: "Ano" },
                    ]}
                  />
                  <ProjectSelect
                    label="Režim DPH"
                    value={values.vatMode}
                    onValueChange={(value) =>
                      handleFieldChange(
                        "vatMode",
                        value as ProjectFormValues["vatMode"],
                      )
                    }
                    options={vatModeOptions}
                    disabled={values.isVatPayer !== "true"}
                  />
                </div>
                <ProjectSelect
                  label="Výchozí měna"
                  value={values.defaultCurrency}
                  onValueChange={(value) =>
                    handleFieldChange(
                      "defaultCurrency",
                      value as ProjectFormValues["defaultCurrency"],
                    )
                  }
                  options={currencyOptions.map((currency) => ({
                    value: currency,
                    label: currency,
                  }))}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-base font-semibold">
                  Kontakt a banka
                </h3>
                <p className="text-sm text-muted-foreground">
                  Údaje, které se mohou propsat do faktur a platebních
                  instrukcí.
                </p>
              </div>

              <div className="grid gap-4">
                <ProjectInput
                  label="Ulice"
                  value={values.street}
                  onChange={(value) => handleFieldChange("street", value)}
                  placeholder="Masarykova 12"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectInput
                    label="Město"
                    value={values.city}
                    onChange={(value) => handleFieldChange("city", value)}
                    placeholder="Brno"
                  />
                  <ProjectInput
                    label="PSČ"
                    value={values.postalCode}
                    onChange={(value) => handleFieldChange("postalCode", value)}
                    placeholder="60200"
                    className="font-mono"
                  />
                </div>
                <ProjectInput
                  label="Stát"
                  value={values.country}
                  onChange={(value) => handleFieldChange("country", value)}
                  placeholder="Česká republika"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectInput
                    label="E-mail"
                    value={values.email}
                    onChange={(value) => handleFieldChange("email", value)}
                    placeholder="fakturace@firma.cz"
                    className="font-mono"
                  />
                  <ProjectInput
                    label="Telefon"
                    value={values.phone}
                    onChange={(value) => handleFieldChange("phone", value)}
                    placeholder="+420 123 456 789"
                    className="font-mono"
                  />
                </div>
                <ProjectInput
                  label="Web"
                  value={values.website}
                  onChange={(value) => handleFieldChange("website", value)}
                  placeholder="https://firma.cz"
                  className="font-mono"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectInput
                    label="Bankovní účet"
                    value={values.bankAccount}
                    onChange={(value) =>
                      handleFieldChange("bankAccount", value)
                    }
                    placeholder="123456789/0100"
                    className="font-mono"
                  />
                  <ProjectInput
                    label="IBAN"
                    value={values.iban}
                    onChange={(value) =>
                      handleFieldChange("iban", value.toUpperCase())
                    }
                    placeholder="CZ6508000000192000145399"
                    className="font-mono uppercase"
                  />
                </div>
                <ProjectInput
                  label="SWIFT"
                  value={values.swift}
                  onChange={(value) =>
                    handleFieldChange("swift", value.toUpperCase())
                  }
                  placeholder="GIBACZPX"
                  className="font-mono uppercase"
                />
              </div>
            </section>
          </div>

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-base font-semibold">Poznámka</h3>
              <p className="text-sm text-muted-foreground">
                Interní poznámky k projektu nebo fakturaci.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-note">Poznámka</Label>
              <Textarea
                id="project-note"
                value={values.note}
                onChange={(event) =>
                  handleFieldChange("note", event.target.value)
                }
                placeholder="Například splatnost, kontaktní osoba nebo interní poznámky"
                className="min-h-28 font-serif"
              />
            </div>
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Zrušit
            </Button>
            <Button type="submit" className="gap-2">
              {isEditing ? (
                <Pencil className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {isEditing ? "Uložit změny" : "Vytvořit projekt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

function ProjectSelect({
  label,
  value,
  onValueChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function App() {
  const projects = useQuery(allProjects);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [editingProjectId, projects],
  );

  return (
    <>
      <ProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
      <ProjectDialog
        open={Boolean(editingProjectId && editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProjectId(null);
        }}
        mode="edit"
        project={editingProject}
      />

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex items-baseline gap-4">
                <h1 className="font-serif text-3xl font-bold tracking-tight">
                  Fakturace
                </h1>
                <Separator orientation="vertical" className="h-6 self-center" />
                <p className="font-serif text-sm italic text-muted-foreground">
                  správa projektů a faktur
                </p>
              </div>

              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Přidat projekt
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10">
          <section className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Projekty ({projects.length})
              </h2>
              <p className="font-serif text-muted-foreground">
                Vytvořte nový projekt, nastavte fakturační údaje a později je
                můžete upravit přímo z karty projektu.
              </p>
            </div>
          </section>

          <Separator className="mb-10" />

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Building2 className="size-8 text-muted-foreground" />
              </div>
              <p className="mb-1 font-serif text-lg text-muted-foreground">
                Zatím žádné projekty
              </p>
              <p className="mb-6 text-sm text-muted-foreground/70">
                Vytvořte svůj první projekt a začněte fakturovat.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Vytvořit projekt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate font-serif text-lg">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5">
                          <Building2 className="size-3" />
                          <span className="truncate">
                            {project.companyName}
                          </span>
                        </CardDescription>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        onClick={() => setEditingProjectId(project.id)}
                        aria-label={`Upravit projekt ${project.name ?? ""}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-muted-foreground">
                          {project.defaultCurrency}
                        </span>
                        <span className="text-right text-muted-foreground">
                          {vatModeLabel(project.vatMode)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {project.ico ? (
                          <span className="font-mono">IČO: {project.ico}</span>
                        ) : null}
                        {project.city ? <span>{project.city}</span> : null}
                        {project.email ? (
                          <span className="font-mono">{project.email}</span>
                        ) : null}
                      </div>
                    </div>

                    <Link
                      to="/$projectName"
                      params={{ projectName: project.name ?? "" }}
                      className="inline-flex items-center gap-1.5 text-xs text-primary/80 transition-colors hover:text-primary"
                    >
                      <FileText className="size-3" />
                      <span className="font-serif italic">
                        Zobrazit faktury
                      </span>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

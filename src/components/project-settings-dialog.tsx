import * as Evolu from "@evolu/common";
import { useState, type FormEvent } from "react";
import type { CompanyLookupResult } from "~/lib/company-registry";
import { useEvolu } from "~/evolu";
import { CompanyRegistryLookupInput } from "~/components/company-registry-lookup-input";
import { Button } from "~/components/ui/button";
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
import {
  Building2,
  CreditCard,
  Pencil,
  Save,
  Trash2,
  Users,
} from "lucide-react";

type ProjectRecord = Record<string, any>;
type CustomerRecord = Record<string, any>;
type PaymentMethodRecord = Record<string, any>;

const vatModeOptions = [
  { value: "standard", label: "Standardní DPH" },
  { value: "reverse-charge", label: "Přenesená daňová povinnost" },
  { value: "none", label: "Bez DPH" },
] as const;

const currencyOptions = ["CZK", "EUR", "USD"] as const;

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

type CustomerFormValues = {
  name: string;
  companyName: string;
  ico: string;
  dic: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
};

type BankAccountFormValues = {
  name: string;
  bankAccount: string;
  iban: string;
  swift: string;
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

function toOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function getEffectiveVatMode(
  vatMode: ProjectFormValues["vatMode"],
  isVatPayer: ProjectFormValues["isVatPayer"],
): ProjectFormValues["vatMode"] {
  if (isVatPayer === "false") return "none";
  return vatMode === "none" ? "standard" : vatMode;
}

function getProjectFormValues(
  project?: ProjectRecord | null,
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

function getCustomerFormValues(
  customer?: CustomerRecord | null,
): CustomerFormValues {
  return {
    name: customer?.name ?? "",
    companyName: customer?.companyName ?? "",
    ico: customer?.ico ?? "",
    dic: customer?.dic ?? "",
    street: customer?.street ?? "",
    city: customer?.city ?? "",
    postalCode: customer?.postalCode ?? "",
    country: customer?.country ?? "",
    email: customer?.email ?? "",
  };
}

function getBankAccountFormValues(
  method?: PaymentMethodRecord | null,
): BankAccountFormValues {
  return {
    name: method?.name ?? "",
    bankAccount: method?.bankAccount ?? "",
    iban: method?.iban ?? "",
    swift: method?.swift ?? "",
  };
}

function SettingsInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  className,
  type,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  const id = `settings-${label.toLowerCase().replace(/\s+/g, "-")}`;

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
        type={type}
      />
    </div>
  );
}

function SettingsSelect({
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

type SettingsTab = "general" | "customers" | "bankAccounts";

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  project,
  customers,
  paymentMethods,
  onProjectRenamed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectRecord;
  customers: readonly CustomerRecord[];
  paymentMethods: readonly PaymentMethodRecord[];
  onProjectRenamed: (name: string) => void;
}) {
  const { update } = useEvolu();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [projectValues, setProjectValues] = useState<ProjectFormValues>(() =>
    getProjectFormValues(project),
  );
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [customerValues, setCustomerValues] = useState<CustomerFormValues>(
    getCustomerFormValues(),
  );
  const [editingBankAccountId, setEditingBankAccountId] = useState<
    string | null
  >(null);
  const [bankAccountValues, setBankAccountValues] =
    useState<BankAccountFormValues>(getBankAccountFormValues());
  const [saveError, setSaveError] = useState<string | null>(null);

  const projectCustomers = customers.filter(
    (customer) => customer.projectId === project.id,
  );
  const projectBankAccounts = paymentMethods.filter(
    (method) =>
      method.projectId === project.id && method.type === "bank-transfer",
  );

  const handleProjectFieldChange = <K extends keyof ProjectFormValues>(
    field: K,
    value: ProjectFormValues[K],
  ) => {
    setProjectValues((current) => {
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

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setEditingCustomerId(null);
    setCustomerValues(getCustomerFormValues());
    setEditingBankAccountId(null);
    setBankAccountValues(getBankAccountFormValues());
    setSaveError(null);
  };

  const applyProjectLookupResult = (result: CompanyLookupResult) => {
    setProjectValues((current) => ({
      ...current,
      companyName: result.name,
      ico: result.ico,
      dic: result.dic ?? "",
      street: result.street ?? "",
      city: result.city ?? "",
      postalCode: result.postalCode ?? "",
      country: result.country ?? "",
    }));
  };

  const handleProjectSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);

    const parsedName = Evolu.NonEmptyString100.from(projectValues.name.trim());
    const parsedCompanyName = Evolu.NonEmptyString100.from(
      projectValues.companyName.trim(),
    );

    if (!parsedName.ok || !parsedCompanyName.ok) {
      setSaveError("Vyplňte název projektu a obchodní jméno.");
      return;
    }

    const result = update("project", {
      id: project.id,
      name: parsedName.value,
      companyName: parsedCompanyName.value,
      ico: toOptionalValue(projectValues.ico),
      dic: toOptionalValue(projectValues.dic),
      vatId: toOptionalValue(projectValues.vatId),
      vatMode: getEffectiveVatMode(
        projectValues.vatMode,
        projectValues.isVatPayer,
      ),
      isVatPayer:
        projectValues.isVatPayer === "true"
          ? Evolu.sqliteTrue
          : Evolu.sqliteFalse,
      street: toOptionalValue(projectValues.street),
      city: toOptionalValue(projectValues.city),
      postalCode: toOptionalValue(projectValues.postalCode),
      country: toOptionalValue(projectValues.country),
      email: toOptionalValue(projectValues.email),
      phone: toOptionalValue(projectValues.phone),
      website: toOptionalValue(projectValues.website),
      bankAccount: toOptionalValue(projectValues.bankAccount),
      iban: toOptionalValue(projectValues.iban)?.toUpperCase() ?? null,
      swift: toOptionalValue(projectValues.swift)?.toUpperCase() ?? null,
      defaultCurrency: projectValues.defaultCurrency as Evolu.CurrencyCode,
      note: toOptionalValue(projectValues.note),
    } as any);

    if (!result.ok) {
      setSaveError(
        "Projekt se nepodařilo uložit. Zkontrolujte formát vyplněných hodnot.",
      );
      return;
    }

    if (parsedName.value !== project.name) onProjectRenamed(parsedName.value);
    onOpenChange(false);
  };

  const startCustomerEdit = (customer: CustomerRecord) => {
    setSaveError(null);
    setEditingCustomerId(customer.id);
    setCustomerValues(getCustomerFormValues(customer));
  };

  const applyCustomerLookupResult = (result: CompanyLookupResult) => {
    setCustomerValues((current) => ({
      ...current,
      name: result.name,
      ico: result.ico,
      dic: result.dic ?? "",
      street: result.street ?? "",
      city: result.city ?? "",
      postalCode: result.postalCode ?? "",
      country: result.country ?? "",
    }));
  };

  const saveCustomer = (customer: CustomerRecord) => {
    setSaveError(null);
    const parsedName = Evolu.NonEmptyString100.from(customerValues.name.trim());

    if (!parsedName.ok) {
      setSaveError("Vyplňte název odběratele.");
      return;
    }

    const result = update("customer", {
      id: customer.id,
      name: parsedName.value,
      companyName: toOptionalValue(customerValues.companyName),
      ico: toOptionalValue(customerValues.ico),
      dic: toOptionalValue(customerValues.dic),
      street: toOptionalValue(customerValues.street),
      city: toOptionalValue(customerValues.city),
      postalCode: toOptionalValue(customerValues.postalCode),
      country: toOptionalValue(customerValues.country),
      email: toOptionalValue(customerValues.email),
    } as any);

    if (!result.ok) {
      setSaveError("Odběratele se nepodařilo uložit.");
      return;
    }

    setEditingCustomerId(null);
  };

  const deleteCustomer = (customer: CustomerRecord) => {
    if (
      !window.confirm(
        `Opravdu chcete smazat odběratele ${customer.name ?? ""}?`,
      )
    ) {
      return;
    }

    setSaveError(null);
    const result = update("customer", {
      id: customer.id,
      isDeleted: Evolu.sqliteTrue,
    } as any);

    if (!result.ok) {
      setSaveError("Odběratele se nepodařilo smazat.");
      return;
    }

    if (editingCustomerId === customer.id) setEditingCustomerId(null);
  };

  const startBankAccountEdit = (method: PaymentMethodRecord) => {
    setSaveError(null);
    setEditingBankAccountId(method.id);
    setBankAccountValues(getBankAccountFormValues(method));
  };

  const saveBankAccount = (method: PaymentMethodRecord) => {
    setSaveError(null);
    const parsedName = Evolu.NonEmptyString100.from(
      bankAccountValues.name.trim(),
    );
    const parsedBankAccount = Evolu.NonEmptyTrimmedString.from(
      bankAccountValues.bankAccount.trim(),
    );

    if (!parsedName.ok || !parsedBankAccount.ok) {
      setSaveError("Vyplňte název účtu a číslo účtu.");
      return;
    }

    const result = update("paymentMethod", {
      id: method.id,
      name: parsedName.value,
      bankAccount: parsedBankAccount.value,
      iban: toOptionalValue(bankAccountValues.iban)?.toUpperCase() ?? null,
      swift: toOptionalValue(bankAccountValues.swift)?.toUpperCase() ?? null,
    } as any);

    if (!result.ok) {
      setSaveError("Bankovní účet se nepodařilo uložit.");
      return;
    }

    setEditingBankAccountId(null);
  };

  const deleteBankAccount = (method: PaymentMethodRecord) => {
    if (!window.confirm(`Opravdu chcete smazat účet ${method.name ?? ""}?`)) {
      return;
    }

    setSaveError(null);
    const result = update("paymentMethod", {
      id: method.id,
      isDeleted: Evolu.sqliteTrue,
    } as any);

    if (!result.ok) {
      setSaveError("Bankovní účet se nepodařilo smazat.");
      return;
    }

    if (editingBankAccountId === method.id) setEditingBankAccountId(null);
  };

  const tabs = [
    { id: "general", label: "Obecné", icon: Building2 },
    { id: "customers", label: "Odběratelé", icon: Users },
    { id: "bankAccounts", label: "Bankovní účty", icon: CreditCard },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] overflow-hidden p-0 sm:max-w-5xl">
        <div className="grid h-full min-h-0 md:grid-cols-[260px_1fr]">
          <aside className="border-b border-border/50 bg-muted/20 p-4 md:border-b-0 md:border-r">
            <DialogHeader className="mb-5">
              <DialogTitle className="font-serif text-xl">
                Nastavení projektu
              </DialogTitle>
              <DialogDescription>{project.name}</DialogDescription>
            </DialogHeader>
            <nav className="grid gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={activeTab === tab.id ? "secondary" : "ghost"}
                    className="justify-start gap-2"
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </aside>

          <div className="min-h-0 overflow-y-auto p-6">
            {saveError && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {saveError}
              </div>
            )}

            {activeTab === "general" ? (
              <form onSubmit={handleProjectSubmit} className="space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-semibold">Obecné</h3>
                  <p className="text-sm text-muted-foreground">
                    Upravte základní fakturační, kontaktní a firemní údaje
                    projektu.
                  </p>
                </div>

                <section className="grid gap-4 md:grid-cols-2">
                  <SettingsInput
                    label="Název projektu"
                    required
                    value={projectValues.name}
                    onChange={(value) =>
                      handleProjectFieldChange("name", value)
                    }
                  />
                  <CompanyRegistryLookupInput
                    label="Obchodní jméno"
                    required
                    value={projectValues.companyName}
                    onChange={(value) =>
                      handleProjectFieldChange("companyName", value)
                    }
                    onSelect={applyProjectLookupResult}
                    placeholder="Firma nebo OSVČ"
                  />
                  <CompanyRegistryLookupInput
                    label="IČO"
                    value={projectValues.ico}
                    onChange={(value) => handleProjectFieldChange("ico", value)}
                    onSelect={applyProjectLookupResult}
                    placeholder="12345678"
                    className="font-mono"
                  />
                  <SettingsInput
                    label="DIČ"
                    value={projectValues.dic}
                    onChange={(value) => handleProjectFieldChange("dic", value)}
                    className="font-mono"
                  />
                  <SettingsInput
                    label="VAT ID"
                    value={projectValues.vatId}
                    onChange={(value) =>
                      handleProjectFieldChange("vatId", value)
                    }
                    className="font-mono"
                  />
                  <SettingsSelect
                    label="Výchozí měna"
                    value={projectValues.defaultCurrency}
                    onValueChange={(value) =>
                      handleProjectFieldChange(
                        "defaultCurrency",
                        value as ProjectFormValues["defaultCurrency"],
                      )
                    }
                    options={currencyOptions.map((currency) => ({
                      value: currency,
                      label: currency,
                    }))}
                  />
                  <SettingsSelect
                    label="Plátce DPH"
                    value={projectValues.isVatPayer}
                    onValueChange={(value) =>
                      handleProjectFieldChange(
                        "isVatPayer",
                        value as ProjectFormValues["isVatPayer"],
                      )
                    }
                    options={[
                      { value: "false", label: "Ne" },
                      { value: "true", label: "Ano" },
                    ]}
                  />
                  <SettingsSelect
                    label="Režim DPH"
                    value={projectValues.vatMode}
                    onValueChange={(value) =>
                      handleProjectFieldChange(
                        "vatMode",
                        value as ProjectFormValues["vatMode"],
                      )
                    }
                    options={vatModeOptions}
                    disabled={projectValues.isVatPayer !== "true"}
                  />
                </section>

                <Separator />

                <section className="grid gap-4 md:grid-cols-2">
                  <SettingsInput
                    label="Ulice"
                    value={projectValues.street}
                    onChange={(value) =>
                      handleProjectFieldChange("street", value)
                    }
                  />
                  <SettingsInput
                    label="Město"
                    value={projectValues.city}
                    onChange={(value) =>
                      handleProjectFieldChange("city", value)
                    }
                  />
                  <SettingsInput
                    label="PSČ"
                    value={projectValues.postalCode}
                    onChange={(value) =>
                      handleProjectFieldChange("postalCode", value)
                    }
                    className="font-mono"
                  />
                  <SettingsInput
                    label="Stát"
                    value={projectValues.country}
                    onChange={(value) =>
                      handleProjectFieldChange("country", value)
                    }
                  />
                  <SettingsInput
                    label="E-mail"
                    value={projectValues.email}
                    onChange={(value) =>
                      handleProjectFieldChange("email", value)
                    }
                    className="font-mono"
                    type="email"
                  />
                  <SettingsInput
                    label="Telefon"
                    value={projectValues.phone}
                    onChange={(value) =>
                      handleProjectFieldChange("phone", value)
                    }
                    className="font-mono"
                  />
                  <SettingsInput
                    label="Web"
                    value={projectValues.website}
                    onChange={(value) =>
                      handleProjectFieldChange("website", value)
                    }
                    className="font-mono"
                  />
                  <SettingsInput
                    label="Bankovní účet"
                    value={projectValues.bankAccount}
                    onChange={(value) =>
                      handleProjectFieldChange("bankAccount", value)
                    }
                    className="font-mono"
                  />
                  <SettingsInput
                    label="IBAN"
                    value={projectValues.iban}
                    onChange={(value) =>
                      handleProjectFieldChange("iban", value.toUpperCase())
                    }
                    className="font-mono uppercase"
                  />
                  <SettingsInput
                    label="SWIFT"
                    value={projectValues.swift}
                    onChange={(value) =>
                      handleProjectFieldChange("swift", value.toUpperCase())
                    }
                    className="font-mono uppercase"
                  />
                </section>

                <div className="grid gap-2">
                  <Label htmlFor="project-settings-note">Poznámka</Label>
                  <Textarea
                    id="project-settings-note"
                    value={projectValues.note}
                    onChange={(event) =>
                      handleProjectFieldChange("note", event.target.value)
                    }
                    className="min-h-24 font-serif"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Zrušit
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Save className="size-4" />
                    Uložit změny
                  </Button>
                </DialogFooter>
              </form>
            ) : null}

            {activeTab === "customers" ? (
              <section className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold">
                    Odběratelé
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upravte nebo smažte odběratele uložené pro tento projekt.
                  </p>
                </div>
                {projectCustomers.length === 0 ? (
                  <EmptySettingsState text="Zatím žádní odběratelé." />
                ) : (
                  <div className="space-y-3">
                    {projectCustomers.map((customer) => {
                      const isEditing = editingCustomerId === customer.id;
                      return (
                        <div
                          key={customer.id}
                          className="rounded-lg border border-border/50 bg-card p-4"
                        >
                          {isEditing ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              <CompanyRegistryLookupInput
                                label="Název"
                                required
                                value={customerValues.name}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    name: value,
                                  }))
                                }
                                onSelect={applyCustomerLookupResult}
                                placeholder="Název firmy / jméno"
                              />
                              <SettingsInput
                                label="Název společnosti"
                                value={customerValues.companyName}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    companyName: value,
                                  }))
                                }
                              />
                              <CompanyRegistryLookupInput
                                label="IČO"
                                value={customerValues.ico}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    ico: value,
                                  }))
                                }
                                onSelect={applyCustomerLookupResult}
                                placeholder="12345678"
                                className="font-mono"
                              />
                              <SettingsInput
                                label="DIČ"
                                value={customerValues.dic}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    dic: value,
                                  }))
                                }
                                className="font-mono"
                              />
                              <SettingsInput
                                label="Ulice"
                                value={customerValues.street}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    street: value,
                                  }))
                                }
                              />
                              <SettingsInput
                                label="Město"
                                value={customerValues.city}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    city: value,
                                  }))
                                }
                              />
                              <SettingsInput
                                label="PSČ"
                                value={customerValues.postalCode}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    postalCode: value,
                                  }))
                                }
                                className="font-mono"
                              />
                              <SettingsInput
                                label="Stát"
                                value={customerValues.country}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    country: value,
                                  }))
                                }
                              />
                              <SettingsInput
                                label="E-mail"
                                value={customerValues.email}
                                onChange={(value) =>
                                  setCustomerValues((current) => ({
                                    ...current,
                                    email: value,
                                  }))
                                }
                                className="font-mono md:col-span-2"
                                type="email"
                              />
                              <div className="flex justify-end gap-2 md:col-span-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditingCustomerId(null)}
                                >
                                  Zrušit
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => saveCustomer(customer)}
                                >
                                  Uložit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <SettingsRow
                              title={customer.name}
                              description={[
                                customer.companyName,
                                customer.ico && `IČO: ${customer.ico}`,
                                customer.email,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                              onEdit={() => startCustomerEdit(customer)}
                              onDelete={() => deleteCustomer(customer)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === "bankAccounts" ? (
              <section className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold">
                    Bankovní účty
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upravte nebo smažte bankovní účty dostupné při vystavení
                    faktury.
                  </p>
                </div>
                {projectBankAccounts.length === 0 ? (
                  <EmptySettingsState text="Zatím žádné bankovní účty." />
                ) : (
                  <div className="space-y-3">
                    {projectBankAccounts.map((method) => {
                      const isEditing = editingBankAccountId === method.id;
                      return (
                        <div
                          key={method.id}
                          className="rounded-lg border border-border/50 bg-card p-4"
                        >
                          {isEditing ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              <SettingsInput
                                label="Název účtu"
                                required
                                value={bankAccountValues.name}
                                onChange={(value) =>
                                  setBankAccountValues((current) => ({
                                    ...current,
                                    name: value,
                                  }))
                                }
                              />
                              <SettingsInput
                                label="Číslo účtu"
                                required
                                value={bankAccountValues.bankAccount}
                                onChange={(value) =>
                                  setBankAccountValues((current) => ({
                                    ...current,
                                    bankAccount: value,
                                  }))
                                }
                                className="font-mono"
                              />
                              <SettingsInput
                                label="IBAN"
                                value={bankAccountValues.iban}
                                onChange={(value) =>
                                  setBankAccountValues((current) => ({
                                    ...current,
                                    iban: value.toUpperCase(),
                                  }))
                                }
                                className="font-mono uppercase"
                              />
                              <SettingsInput
                                label="SWIFT"
                                value={bankAccountValues.swift}
                                onChange={(value) =>
                                  setBankAccountValues((current) => ({
                                    ...current,
                                    swift: value.toUpperCase(),
                                  }))
                                }
                                className="font-mono uppercase"
                              />
                              <div className="flex justify-end gap-2 md:col-span-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditingBankAccountId(null)}
                                >
                                  Zrušit
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => saveBankAccount(method)}
                                >
                                  Uložit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <SettingsRow
                              title={method.name}
                              description={[
                                method.bankAccount,
                                method.iban,
                                method.swift,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                              onEdit={() => startBankAccountEdit(method)}
                              onDelete={() => deleteBankAccount(method)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsRow({
  title,
  description,
  onEdit,
  onDelete,
}: {
  title: string | null;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-serif font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {description || "Bez detailů"}
        </p>
      </div>
      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit}>
          <Pencil className="size-4" />
          <span className="sr-only">Upravit</span>
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
          <span className="sr-only">Smazat</span>
        </Button>
      </div>
    </div>
  );
}

function EmptySettingsState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { evolu, useEvolu } from "~/evolu";
import * as Evolu from "@evolu/common";
import { useQueries } from "@evolu/react";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/ui/date-picker";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "~/components/ui/table";
import { useForm, useStore } from "@tanstack/react-form-start";
import { cn } from "~/lib/utils";
import { z } from "zod";
import { AlertCircle, Plus, Trash2, Save, UserPlus } from "lucide-react";
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
  type ComponentProps,
  type ReactNode,
} from "react";

export const Route = createFileRoute("/$projectName/new")({
  component: NewInvoiceComponent,
});

const allProjects = evolu.createQuery((db) =>
  db.selectFrom("project").selectAll().where("isDeleted", "is", null),
);

const allCustomers = evolu.createQuery((db) =>
  db.selectFrom("customer").selectAll().where("isDeleted", "is", null),
);

const allInvoices = evolu.createQuery((db) =>
  db
    .selectFrom("invoice")
    .select(["id", "invoiceNumber", "projectId"])
    .where("isDeleted", "is", null),
);

const allPaymentMethods = evolu.createQuery((db) =>
  db.selectFrom("paymentMethod").selectAll().where("isDeleted", "is", null),
);

// ── Line item state ──────────────────────────────────────────────────
interface LineItem {
  key: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
}

function emptyLineItem(key: number): LineItem {
  return {
    key,
    description: "",
    quantity: "1",
    unit: "ks",
    unitPrice: "0",
    vatRate: "21",
  };
}

function shouldApplyVat(vatMode: string | null | undefined) {
  return vatMode === "standard";
}

function calcLineItem(item: LineItem, applyVat = true) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const vat = applyVat ? parseFloat(item.vatRate) || 0 : 0;
  const subtotal = qty * price;
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}

function getEffectiveInvoiceValues(
  values: InvoiceFormValues,
  applyVat: boolean,
): InvoiceFormValues {
  if (applyVat) return values;

  return {
    ...values,
    taxableSupplyDate: values.issueDate,
  };
}

// ── New Customer Dialog ──────────────────────────────────────────────
function NewCustomerDialog({
  open,
  onClose,
  onCreated,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  projectId: string;
}) {
  const { insert } = useEvolu();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const customerForm = useForm({
    defaultValues: {
      name: "",
      companyName: "",
      ico: "",
      dic: "",
      street: "",
      city: "",
      postalCode: "",
      email: "",
    } satisfies CustomerFormValues,
    validators: {
      onSubmit: customerFormSchema,
    },
    onSubmit: async ({ value }) => {
      const parsedName = Evolu.NonEmptyString100.from(value.name.trim());
      if (!parsedName.ok) {
        setSaveError(
          "Odběratele se nepodařilo uložit. Zkontrolujte povinná pole.",
        );
        return;
      }

      const result = insert("customer", {
        projectId: projectId as any,
        name: parsedName.value,
        companyName: value.companyName.trim()
          ? ((Evolu.TrimmedString100.from(value.companyName.trim()) as any)
              .value ?? null)
          : null,
        ico: value.ico.trim() || null,
        dic: value.dic.trim() || null,
        vatId: null,
        vatMode: null,
        street: value.street.trim() || null,
        city: value.city.trim() || null,
        postalCode: value.postalCode.trim() || null,
        country: null,
        email: value.email.trim() || null,
        phone: null,
        note: null,
      } as any);

      if (!result.ok) {
        setSaveError(
          "Odběratele se nepodařilo uložit. Zkontrolujte formát hodnot.",
        );
        return;
      }

      onCreated(result.value.id);
      customerForm.reset();
      setHasAttemptedSave(false);
      setSaveError(null);
      onClose();
    },
  });
  const customerValues = useStore(customerForm.store, (state) => state.values);
  const customerIsSubmitting = useStore(
    customerForm.store,
    (state) => state.isSubmitting,
  );
  const customerValidation = useMemo(
    () => customerFormSchema.safeParse(customerValues),
    [customerValues],
  );
  const customerErrors = useMemo(() => {
    if (customerValidation.success) return new Map<string, string>();

    const nextErrors = new Map<string, string>();
    for (const issue of customerValidation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !nextErrors.has(field)) {
        nextErrors.set(field, issue.message);
      }
    }
    return nextErrors;
  }, [customerValidation]);
  const customerCanSave = customerValidation.success && !customerIsSubmitting;

  const customerFieldInvalid = (field: keyof CustomerFormValues) =>
    hasAttemptedSave && customerErrors.has(field);

  const handleSave = () => {
    setHasAttemptedSave(true);
    setSaveError(null);

    if (!customerCanSave) return;

    void customerForm.handleSubmit();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;

    customerForm.reset();
    setHasAttemptedSave(false);
    setSaveError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Nový odběratel</DialogTitle>
        </DialogHeader>

        {saveError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Název"
              required
              value={customerValues.name}
              onChange={(e) =>
                customerForm.setFieldValue("name", e.target.value)
              }
              placeholder="Název firmy / jméno"
              className="font-serif"
              error={
                customerFieldInvalid("name")
                  ? customerErrors.get("name")
                  : undefined
              }
            />
            <TextField
              label="Název společnosti"
              value={customerValues.companyName}
              onChange={(e) =>
                customerForm.setFieldValue("companyName", e.target.value)
              }
              placeholder="s.r.o., a.s. ..."
              className="font-serif"
              error={
                customerFieldInvalid("companyName")
                  ? customerErrors.get("companyName")
                  : undefined
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="IČO"
              value={customerValues.ico}
              onChange={(e) =>
                customerForm.setFieldValue("ico", e.target.value)
              }
              placeholder="12345678"
              className="font-mono"
              error={
                customerFieldInvalid("ico")
                  ? customerErrors.get("ico")
                  : undefined
              }
            />
            <TextField
              label="DIČ"
              value={customerValues.dic}
              onChange={(e) =>
                customerForm.setFieldValue("dic", e.target.value)
              }
              placeholder="CZ12345678"
              className="font-mono"
              error={
                customerFieldInvalid("dic")
                  ? customerErrors.get("dic")
                  : undefined
              }
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Ulice"
              value={customerValues.street}
              onChange={(e) =>
                customerForm.setFieldValue("street", e.target.value)
              }
              className="font-serif"
              wrapperClassName="col-span-2"
              error={
                customerFieldInvalid("street")
                  ? customerErrors.get("street")
                  : undefined
              }
            />
            <TextField
              label="Město"
              value={customerValues.city}
              onChange={(e) =>
                customerForm.setFieldValue("city", e.target.value)
              }
              className="font-serif"
              error={
                customerFieldInvalid("city")
                  ? customerErrors.get("city")
                  : undefined
              }
            />
            <TextField
              label="PSČ"
              value={customerValues.postalCode}
              onChange={(e) =>
                customerForm.setFieldValue("postalCode", e.target.value)
              }
              className="font-mono"
              error={
                customerFieldInvalid("postalCode")
                  ? customerErrors.get("postalCode")
                  : undefined
              }
            />
          </div>
          <TextField
            label="E-mail"
            value={customerValues.email}
            onChange={(e) =>
              customerForm.setFieldValue("email", e.target.value)
            }
            type="email"
            className="font-mono"
            error={
              customerFieldInvalid("email")
                ? customerErrors.get("email")
                : undefined
            }
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={!customerCanSave}>
            <UserPlus className="size-4 mr-1.5" />
            Vytvořit odběratele
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helper: today as ISO date string ────────────────────────────────
function todayIso(): string {
  return new Date().toISOString().split("T")[0]!;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

interface InvoiceFormValues {
  invoiceNumber: string;
  customerId: string;
  issueDate: string;
  taxableSupplyDate: string;
  dueDate: string;
  currency: string;
  vatMode: string;
  paymentMethod: string;
  bankPaymentMethodId: string;
  customPaymentMethod: string;
  variableSymbol: string;
  constantSymbol: string;
  specificSymbol: string;
  note: string;
  items: LineItem[];
}

interface BankAccountFormValues {
  name: string;
  bankAccount: string;
  iban: string;
  swift: string;
}

const paymentMethodOptions = ["Banka", "Hotove", "Jine"] as const;

const paymentMethodSchema = z.enum(paymentMethodOptions, {
  error: "Vyberte platební metodu.",
});

const projectBankAccountOptionValue = "__project-default-bank-account__";

interface PreparedInvoiceItem {
  sortOrder: number;
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

interface InvoiceSaveValidation {
  canSave: boolean;
  errors: string[];
  itemErrors: Map<number, string[]>;
  preparedItems: PreparedInvoiceItem[];
  invoiceNumber: string | null;
  issueDate: string | null;
  taxableSupplyDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  vatTotal: number | null;
  total: number | null;
  customerMissing: boolean;
  invoiceNumberInvalid: boolean;
  issueDateInvalid: boolean;
  taxableSupplyDateInvalid: boolean;
  dueDateInvalid: boolean;
  paymentMethodInvalid: boolean;
  bankPaymentMethodInvalid: boolean;
  customPaymentMethodInvalid: boolean;
  variableSymbolInvalid: boolean;
  constantSymbolInvalid: boolean;
  specificSymbolInvalid: boolean;
}

interface CustomerFormValues {
  name: string;
  companyName: string;
  ico: string;
  dic: string;
  street: string;
  city: string;
  postalCode: string;
  email: string;
}

function isValidDateIso(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateIsoSchema = z.string().refine(isValidDateIso, {
  message: "Zadejte platné datum.",
});

const optionalDigits = (maxLength: number, message: string) =>
  z.string().refine(
    (value) => {
      const trimmed = value.trim();
      return (
        trimmed.length === 0 ||
        (/^\d+$/.test(trimmed) && trimmed.length <= maxLength)
      );
    },
    { message },
  );

const lineItemSchema = z.object({
  key: z.number(),
  description: z.string().trim().min(1, "doplňte popis."),
  quantity: z.string().refine((value) => {
    const quantity = Number(value);
    return Number.isFinite(quantity) && quantity > 0;
  }, "počet musí být větší než 0."),
  unit: z.string(),
  unitPrice: z.string().refine((value) => {
    const price = Number(value);
    return Number.isFinite(price) && price >= 0;
  }, "cena za kus musí být 0 nebo více."),
  vatRate: z.string().refine((value) => {
    const vatRate = Number(value);
    return Number.isFinite(vatRate) && vatRate >= 0;
  }, "DPH musí být 0 nebo více."),
});

const invoiceFormSchema = z
  .object({
    invoiceNumber: z
      .string()
      .trim()
      .max(100, "Číslo faktury je příliš dlouhé."),
    customerId: z.string().min(1, "Vyberte odběratele."),
    issueDate: dateIsoSchema,
    taxableSupplyDate: dateIsoSchema,
    dueDate: dateIsoSchema,
    currency: z.string().min(1, "Vyberte měnu."),
    vatMode: z.enum(["none", "standard", "reverse-charge"]),
    paymentMethod: paymentMethodSchema,
    bankPaymentMethodId: z.string(),
    customPaymentMethod: z
      .string()
      .trim()
      .max(100, "Platební metoda může mít max. 100 znaků."),
    variableSymbol: optionalDigits(
      10,
      "Variabilní symbol může obsahovat jen číslice a max. 10 znaků.",
    ),
    constantSymbol: optionalDigits(
      4,
      "Konstantní symbol může obsahovat jen číslice a max. 4 znaky.",
    ),
    specificSymbol: optionalDigits(
      10,
      "Specifický symbol může obsahovat jen číslice a max. 10 znaků.",
    ),
    note: z.string().max(1000, "Poznámka je příliš dlouhá."),
    items: z.array(lineItemSchema).min(1, "Přidejte alespoň jednu položku."),
  })
  .superRefine((values, ctx) => {
    if (
      values.paymentMethod === "Banka" &&
      values.bankPaymentMethodId.trim().length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["bankPaymentMethodId"],
        message: "Vyberte bankovní účet.",
      });
    }

    if (
      values.paymentMethod === "Jine" &&
      values.customPaymentMethod.trim().length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customPaymentMethod"],
        message: "Doplňte platební metodu.",
      });
    }
  });

const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Název je povinný.")
    .max(100, "Název může mít max. 100 znaků."),
  companyName: z
    .string()
    .trim()
    .max(100, "Název společnosti může mít max. 100 znaků."),
  ico: z.string().trim().max(16, "IČO může mít max. 16 znaků."),
  dic: z.string().trim().max(20, "DIČ může mít max. 20 znaků."),
  street: z.string().trim().max(100, "Ulice může mít max. 100 znaků."),
  city: z.string().trim().max(100, "Město může mít max. 100 znaků."),
  postalCode: z.string().trim().max(20, "PSČ může mít max. 20 znaků."),
  email: z
    .string()
    .trim()
    .max(100, "E-mail může mít max. 100 znaků.")
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      "Zadejte platný e-mail.",
    ),
});

const bankAccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Název účtu je povinný.")
    .max(100, "Název účtu může mít max. 100 znaků."),
  bankAccount: z
    .string()
    .trim()
    .min(1, "Číslo účtu je povinné.")
    .max(34, "Číslo účtu může mít max. 34 znaků."),
  iban: z.string().trim().max(34, "IBAN může mít max. 34 znaků."),
  swift: z.string().trim().max(11, "SWIFT může mít max. 11 znaků."),
});

const resolvedInvoiceNumberSchema = z
  .string()
  .trim()
  .min(1, "Doplňte platné číslo faktury.")
  .max(100, "Číslo faktury je příliš dlouhé.");

const totalsSchema = z.object({
  subtotal: z
    .number()
    .finite()
    .nonnegative("Nepodařilo se spočítat částky faktury."),
  vatTotal: z
    .number()
    .finite()
    .nonnegative("Nepodařilo se spočítat částky faktury."),
  total: z
    .number()
    .finite()
    .nonnegative("Nepodařilo se spočítat částky faktury."),
});

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toEvoluDateIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return { ok: false as const };
  }

  return Evolu.dateToDateIso(new Date(year, month - 1, day));
}

function FieldBlock({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-mono uppercase tracking-wider">
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  wrapperClassName?: string;
} & ComponentProps<typeof Input>;

function TextField({
  label,
  required,
  error,
  wrapperClassName,
  className,
  ...props
}: TextFieldProps) {
  return (
    <FieldBlock
      label={label}
      required={required}
      error={error}
      className={wrapperClassName}
    >
      <Input {...props} className={className} aria-invalid={Boolean(error)} />
    </FieldBlock>
  );
}

function NewBankAccountDialog({
  open,
  onClose,
  onCreated,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  projectId: string;
}) {
  const { insert } = useEvolu();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const bankAccountForm = useForm({
    defaultValues: {
      name: "",
      bankAccount: "",
      iban: "",
      swift: "",
    } satisfies BankAccountFormValues,
    validators: {
      onSubmit: bankAccountFormSchema,
    },
    onSubmit: async ({ value }) => {
      const parsedName = Evolu.NonEmptyString100.from(value.name.trim());
      const parsedBankAccount = Evolu.NonEmptyTrimmedString.from(
        value.bankAccount.trim(),
      );

      if (!parsedName.ok || !parsedBankAccount.ok) {
        setSaveError(
          "Bankovní účet se nepodařilo uložit. Zkontrolujte povinná pole.",
        );
        return;
      }

      const result = insert("paymentMethod", {
        projectId: projectId as any,
        name: parsedName.value,
        type: "bank-transfer",
        bankAccount: parsedBankAccount.value,
        iban: value.iban.trim().toUpperCase() || null,
        swift: value.swift.trim().toUpperCase() || null,
        isDefault: Evolu.sqliteFalse,
      } as any);

      if (!result.ok) {
        setSaveError(
          "Bankovní účet se nepodařilo uložit. Zkontrolujte formát hodnot.",
        );
        return;
      }

      onCreated(result.value.id);
      bankAccountForm.reset();
      setHasAttemptedSave(false);
      setSaveError(null);
      onClose();
    },
  });
  const bankAccountValues = useStore(
    bankAccountForm.store,
    (state) => state.values,
  );
  const bankAccountIsSubmitting = useStore(
    bankAccountForm.store,
    (state) => state.isSubmitting,
  );
  const bankAccountValidation = useMemo(
    () => bankAccountFormSchema.safeParse(bankAccountValues),
    [bankAccountValues],
  );
  const bankAccountErrors = useMemo(() => {
    if (bankAccountValidation.success) return new Map<string, string>();

    const nextErrors = new Map<string, string>();
    for (const issue of bankAccountValidation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !nextErrors.has(field)) {
        nextErrors.set(field, issue.message);
      }
    }
    return nextErrors;
  }, [bankAccountValidation]);
  const bankAccountCanSave =
    bankAccountValidation.success && !bankAccountIsSubmitting;

  const bankAccountFieldInvalid = (field: keyof BankAccountFormValues) =>
    hasAttemptedSave && bankAccountErrors.has(field);

  const handleSave = () => {
    setHasAttemptedSave(true);
    setSaveError(null);

    if (!bankAccountCanSave) return;

    void bankAccountForm.handleSubmit();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;

    bankAccountForm.reset();
    setHasAttemptedSave(false);
    setSaveError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Nový bankovní účet</DialogTitle>
        </DialogHeader>

        {saveError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="grid gap-4 py-2">
          <TextField
            label="Název účtu"
            required
            value={bankAccountValues.name}
            onChange={(e) =>
              bankAccountForm.setFieldValue("name", e.target.value)
            }
            placeholder="Hlavní účet"
            className="font-serif"
            error={
              bankAccountFieldInvalid("name")
                ? bankAccountErrors.get("name")
                : undefined
            }
          />
          <TextField
            label="Číslo účtu"
            required
            value={bankAccountValues.bankAccount}
            onChange={(e) =>
              bankAccountForm.setFieldValue("bankAccount", e.target.value)
            }
            placeholder="123456789/0100"
            className="font-mono"
            error={
              bankAccountFieldInvalid("bankAccount")
                ? bankAccountErrors.get("bankAccount")
                : undefined
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="IBAN"
              value={bankAccountValues.iban}
              onChange={(e) =>
                bankAccountForm.setFieldValue(
                  "iban",
                  e.target.value.toUpperCase(),
                )
              }
              className="font-mono"
              error={
                bankAccountFieldInvalid("iban")
                  ? bankAccountErrors.get("iban")
                  : undefined
              }
            />
            <TextField
              label="SWIFT"
              value={bankAccountValues.swift}
              onChange={(e) =>
                bankAccountForm.setFieldValue(
                  "swift",
                  e.target.value.toUpperCase(),
                )
              }
              className="font-mono"
              error={
                bankAccountFieldInvalid("swift")
                  ? bankAccountErrors.get("swift")
                  : undefined
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={!bankAccountCanSave}>
            <Plus className="size-4 mr-1.5" />
            Přidat účet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function validateInvoiceForm(
  values: InvoiceFormValues,
  effectiveInvoiceNumber: string,
  effectiveVatMode: InvoiceFormValues["vatMode"],
  hasProject: boolean,
  totals: { subtotal: number; vatTotal: number; total: number },
): InvoiceSaveValidation {
  const errors: string[] = [];
  const itemErrors = new Map<number, string[]>();
  const preparedItems: PreparedInvoiceItem[] = [];

  const formResult = invoiceFormSchema.safeParse({
    ...values,
    vatMode: effectiveVatMode,
  });
  const parsedInvoiceNumber = resolvedInvoiceNumberSchema.safeParse(
    effectiveInvoiceNumber,
  );
  const totalsResult = totalsSchema.safeParse(totals);
  const parsedIssueDate = toEvoluDateIso(values.issueDate);
  const parsedSupplyDate = toEvoluDateIso(values.taxableSupplyDate);
  const parsedDueDate = toEvoluDateIso(values.dueDate);

  if (!hasProject) errors.push("Projekt nebyl nalezen.");

  if (!formResult.success) {
    for (const issue of formResult.error.issues) {
      const [root, index] = issue.path;

      if (root === "items" && typeof index === "number") {
        const item = values.items[index];
        if (!item) continue;

        const message = `Položka ${index + 1}: ${issue.message}`;
        const existing = itemErrors.get(item.key) ?? [];
        if (!existing.includes(message)) {
          existing.push(message);
          itemErrors.set(item.key, existing);
          errors.push(message);
        }
        continue;
      }

      if (!errors.includes(issue.message)) {
        errors.push(issue.message);
      }
    }
  }

  if (
    !parsedInvoiceNumber.success &&
    !errors.includes(parsedInvoiceNumber.error.issues[0]?.message ?? "")
  ) {
    errors.push(
      parsedInvoiceNumber.error.issues[0]?.message ??
        "Doplňte platné číslo faktury.",
    );
  }

  if (!totalsResult.success) {
    const message =
      totalsResult.error.issues[0]?.message ??
      "Nepodařilo se spočítat částky faktury.";
    if (!errors.includes(message)) {
      errors.push(message);
    }
  }

  if (
    !parsedIssueDate.ok &&
    !errors.includes("Doplňte platné datum vystavení.")
  ) {
    errors.push("Doplňte platné datum vystavení.");
  }
  if (
    !parsedSupplyDate.ok &&
    !errors.includes("Doplňte platné datum zdanitelného plnění.")
  ) {
    errors.push("Doplňte platné datum zdanitelného plnění.");
  }
  if (
    !parsedDueDate.ok &&
    !errors.includes("Doplňte platné datum splatnosti.")
  ) {
    errors.push("Doplňte platné datum splatnosti.");
  }

  if (formResult.success) {
    const applyVat = shouldApplyVat(effectiveVatMode);
    preparedItems.push(
      ...formResult.data.items.map((item, index) => {
        const calc = calcLineItem(item, applyVat);
        return {
          sortOrder: index,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unit: item.unit.trim() || null,
          unitPrice: Number(item.unitPrice),
          vatRate: applyVat ? Number(item.vatRate) : 0,
          subtotal: calc.subtotal,
          vatAmount: calc.vatAmount,
          total: calc.total,
        };
      }),
    );
  }

  const variableSymbolInvalid = Boolean(
    formResult.success === false &&
    formResult.error.issues.some((issue) => issue.path[0] === "variableSymbol"),
  );
  const paymentMethodInvalid = Boolean(
    formResult.success === false &&
    formResult.error.issues.some((issue) => issue.path[0] === "paymentMethod"),
  );
  const customPaymentMethodInvalid = Boolean(
    formResult.success === false &&
    formResult.error.issues.some(
      (issue) => issue.path[0] === "customPaymentMethod",
    ),
  );
  const bankPaymentMethodInvalid = Boolean(
    formResult.success === false &&
    formResult.error.issues.some(
      (issue) => issue.path[0] === "bankPaymentMethodId",
    ),
  );
  const constantSymbolInvalid = Boolean(
    formResult.success === false &&
    formResult.error.issues.some((issue) => issue.path[0] === "constantSymbol"),
  );
  const specificSymbolInvalid = Boolean(
    formResult.success === false &&
    formResult.error.issues.some((issue) => issue.path[0] === "specificSymbol"),
  );

  return {
    canSave:
      hasProject &&
      errors.length === 0 &&
      parsedInvoiceNumber.success &&
      formResult.success &&
      totalsResult.success &&
      parsedIssueDate.ok &&
      parsedSupplyDate.ok &&
      parsedDueDate.ok,
    errors,
    itemErrors,
    preparedItems,
    invoiceNumber: parsedInvoiceNumber.success
      ? parsedInvoiceNumber.data
      : null,
    issueDate: parsedIssueDate.ok ? parsedIssueDate.value : null,
    taxableSupplyDate: parsedSupplyDate.ok ? parsedSupplyDate.value : null,
    dueDate: parsedDueDate.ok ? parsedDueDate.value : null,
    subtotal: totalsResult.success ? totalsResult.data.subtotal : null,
    vatTotal: totalsResult.success ? totalsResult.data.vatTotal : null,
    total: totalsResult.success ? totalsResult.data.total : null,
    customerMissing: !values.customerId,
    invoiceNumberInvalid: !parsedInvoiceNumber.success,
    issueDateInvalid:
      !parsedIssueDate.ok ||
      Boolean(
        formResult.success === false &&
        formResult.error.issues.some((issue) => issue.path[0] === "issueDate"),
      ),
    taxableSupplyDateInvalid:
      !parsedSupplyDate.ok ||
      Boolean(
        formResult.success === false &&
        formResult.error.issues.some(
          (issue) => issue.path[0] === "taxableSupplyDate",
        ),
      ),
    dueDateInvalid:
      !parsedDueDate.ok ||
      Boolean(
        formResult.success === false &&
        formResult.error.issues.some((issue) => issue.path[0] === "dueDate"),
      ),
    paymentMethodInvalid,
    bankPaymentMethodInvalid,
    customPaymentMethodInvalid,
    variableSymbolInvalid,
    constantSymbolInvalid,
    specificSymbolInvalid,
  };
}

function DatePickerField({
  label,
  value,
  onChange,
  invalid,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  className?: string;
}) {
  const selectedDate = parseIsoDate(value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-mono uppercase tracking-wider">
        {label} *
      </Label>
      <DatePicker
        value={selectedDate}
        onChange={(date) => {
          if (!date) return;
          onChange(toIsoDate(date));
        }}
        placeholder="Vyberte datum"
        invalid={invalid}
        className="w-full justify-between font-mono"
      />
    </div>
  );
}

function NewInvoiceSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-3 w-44" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <section key={index} className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-md border border-border/50">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 border-b border-border/50 px-4 py-4 last:border-b-0"
          >
            <Skeleton className="col-span-2 h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pb-8 pt-4">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────
function NewInvoiceContent() {
  const { projectName } = Route.useParams();
  const decodedName = decodeURIComponent(projectName);
  const navigate = useNavigate();
  const { insert } = useEvolu();

  const [projects, customers, existingInvoices, paymentMethods] = useQueries([
    allProjects,
    allCustomers,
    allInvoices,
    allPaymentMethods,
  ]);

  const project = useMemo(
    () => projects.find((p) => p.name === decodedName),
    [projects, decodedName],
  );

  const projectCustomers = useMemo(
    () => (project ? customers.filter((c) => c.projectId === project.id) : []),
    [customers, project],
  );

  const bankPaymentMethods = useMemo(
    () =>
      project
        ? paymentMethods.filter(
            (method) =>
              method.projectId === project.id &&
              method.type === "bank-transfer",
          )
        : [],
    [paymentMethods, project],
  );

  const projectDefaultBankOption = useMemo(() => {
    if (!project?.bankAccount) return null;

    return {
      id: projectBankAccountOptionValue,
      name: project.companyName || "Výchozí účet projektu",
      bankAccount: project.bankAccount,
      iban: project.iban,
      swift: project.swift,
    };
  }, [project]);

  const selectableBankPaymentMethods = useMemo(
    () =>
      projectDefaultBankOption
        ? [projectDefaultBankOption, ...bankPaymentMethods]
        : bankPaymentMethods,
    [bankPaymentMethods, projectDefaultBankOption],
  );

  const applyVat = shouldApplyVat(project?.vatMode);

  // Generate next invoice number
  const nextInvoiceNumber = useMemo(() => {
    if (!project) return "";
    const projectInvs = existingInvoices.filter(
      (inv) => inv.projectId === project.id,
    );
    const year = new Date().getFullYear();
    const num = projectInvs.length + 1;
    return `${year}${String(num).padStart(4, "0")}`;
  }, [project, existingInvoices]);

  // ── Form state ──────────────────────────────────────────────────
  const today = todayIso();
  const form = useForm({
    defaultValues: {
      invoiceNumber: "",
      customerId: "",
      issueDate: today,
      taxableSupplyDate: today,
      dueDate: addDays(today, 14),
      currency: "CZK",
      vatMode: "standard",
      paymentMethod: "Banka",
      bankPaymentMethodId: "",
      customPaymentMethod: "",
      variableSymbol: "",
      constantSymbol: "",
      specificSymbol: "",
      note: "",
      items: [emptyLineItem(1)],
    } satisfies InvoiceFormValues,
    validators: {
      onSubmit: invoiceFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!project) return;

      const effectiveValue = getEffectiveInvoiceValues(value, applyVat);

      const projectVatMode: InvoiceFormValues["vatMode"] =
        project.vatMode === "none" ||
        project.vatMode === "standard" ||
        project.vatMode === "reverse-charge"
          ? project.vatMode
          : "standard";

      const effectiveInvoiceNumber =
        effectiveValue.invoiceNumber || nextInvoiceNumber;
      const totals = effectiveValue.items.reduce(
        (acc, item) => {
          const calc = calcLineItem(item, applyVat);
          return {
            subtotal: acc.subtotal + calc.subtotal,
            vatTotal: acc.vatTotal + calc.vatAmount,
            total: acc.total + calc.total,
          };
        },
        { subtotal: 0, vatTotal: 0, total: 0 },
      );
      const validation = validateInvoiceForm(
        effectiveValue,
        effectiveInvoiceNumber,
        projectVatMode,
        true,
        totals,
      );

      if (
        !project ||
        !validation.canSave ||
        !validation.invoiceNumber ||
        !validation.issueDate ||
        !validation.taxableSupplyDate ||
        !validation.dueDate ||
        validation.subtotal === null ||
        validation.vatTotal === null ||
        validation.total === null
      ) {
        return;
      }

      const selectedCustomer = projectCustomers.find(
        (customer) => customer.id === effectiveValue.customerId,
      );
      const selectedBankPaymentMethod = selectableBankPaymentMethods.find(
        (method) => method.id === effectiveValue.bankPaymentMethodId,
      );
      const resolvedPaymentMethodName =
        effectiveValue.paymentMethod === "Jine"
          ? effectiveValue.customPaymentMethod.trim()
          : effectiveValue.paymentMethod;

      const existingPaymentMethod = paymentMethods.find(
        (method) =>
          method.projectId === project.id &&
          (effectiveValue.paymentMethod === "Banka"
            ? method.id === selectedBankPaymentMethod?.id
            : method.name === resolvedPaymentMethodName),
      );

      let paymentMethodId = existingPaymentMethod?.id ?? null;

      try {
        if (!paymentMethodId) {
          const paymentMethodType =
            effectiveValue.paymentMethod === "Hotove"
              ? "cash"
              : "bank-transfer";
          const paymentMethodResult = insert("paymentMethod", {
            projectId: project.id,
            name: resolvedPaymentMethodName,
            type: paymentMethodType,
            bankAccount:
              paymentMethodType === "bank-transfer"
                ? (selectedBankPaymentMethod?.bankAccount ??
                  project.bankAccount)
                : null,
            iban:
              paymentMethodType === "bank-transfer"
                ? (selectedBankPaymentMethod?.iban ?? project.iban)
                : null,
            swift:
              paymentMethodType === "bank-transfer"
                ? (selectedBankPaymentMethod?.swift ?? project.swift)
                : null,
            isDefault: false,
          } as any);

          if (!paymentMethodResult.ok) {
            setSaveError("Platební metodu se nepodařilo uložit.");
            return;
          }

          paymentMethodId = paymentMethodResult.value.id;
        }

        const invoiceResult = insert("invoice", {
          projectId: project.id,
          customerId: effectiveValue.customerId as any,
          paymentMethodId,
          invoiceNumber: validation.invoiceNumber,
          issueDate: validation.issueDate,
          taxableSupplyDate: validation.taxableSupplyDate,
          dueDate: validation.dueDate,
          paidDate: null,
          status: "issued",
          currency: effectiveValue.currency as Evolu.CurrencyCode,
          vatMode: project.vatMode,
          variableSymbol: effectiveValue.variableSymbol.trim() || null,
          constantSymbol: effectiveValue.constantSymbol.trim() || null,
          specificSymbol: effectiveValue.specificSymbol.trim() || null,
          subtotal: validation.subtotal,
          vatTotal: validation.vatTotal,
          total: validation.total,
          note: effectiveValue.note.trim() || null,
          supplierCompanyName: project.companyName,
          supplierIco: project.ico,
          supplierDic: project.dic,
          supplierVatId: project.vatId,
          supplierStreet: project.street,
          supplierCity: project.city,
          supplierPostalCode: project.postalCode,
          supplierCountry: project.country,
          supplierBankAccount:
            effectiveValue.paymentMethod === "Banka"
              ? (selectedBankPaymentMethod?.bankAccount ?? project.bankAccount)
              : null,
          supplierIban:
            effectiveValue.paymentMethod === "Banka"
              ? (selectedBankPaymentMethod?.iban ?? project.iban)
              : null,
          supplierSwift:
            effectiveValue.paymentMethod === "Banka"
              ? (selectedBankPaymentMethod?.swift ?? project.swift)
              : null,
          customerName: selectedCustomer?.name ?? null,
          customerCompanyName: selectedCustomer?.companyName ?? null,
          customerIco: selectedCustomer?.ico ?? null,
          customerDic: selectedCustomer?.dic ?? null,
          customerStreet: selectedCustomer?.street ?? null,
          customerCity: selectedCustomer?.city ?? null,
          customerPostalCode: selectedCustomer?.postalCode ?? null,
        } as any);

        if (!invoiceResult.ok) {
          setSaveError(
            "Fakturu se nepodařilo uložit. Zkontrolujte povinná pole a formát hodnot.",
          );
          return;
        }

        for (const item of validation.preparedItems) {
          const itemResult = insert("invoiceItem", {
            invoiceId: invoiceResult.value.id,
            sortOrder: item.sortOrder,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            subtotal: item.subtotal,
            vatAmount: item.vatAmount,
            total: item.total,
          } as any);

          if (!itemResult.ok) {
            setSaveError(
              "Faktura vznikla, ale nepodařilo se uložit všechny položky. Otevřete ji a zkontrolujte obsah.",
            );
            navigate({
              to: "/$projectName/$invoiceId",
              params: {
                projectName,
                invoiceId: invoiceResult.value.id,
              },
            });
            return;
          }
        }

        navigate({
          to: "/$projectName/$invoiceId",
          params: {
            projectName,
            invoiceId: invoiceResult.value.id,
          },
        });
      } catch {
        setSaveError("Při ukládání došlo k neočekávané chybě.");
      }
    },
  });
  const formValues = useStore(form.store, (state) => state.values);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const [nextKey, setNextKey] = useState(2);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);

  useEffect(() => {
    if (applyVat) return;
    if (formValues.taxableSupplyDate === formValues.issueDate) return;

    form.setFieldValue("taxableSupplyDate", formValues.issueDate);
  }, [applyVat, form, formValues.issueDate, formValues.taxableSupplyDate]);

  useEffect(() => {
    if (
      formValues.paymentMethod === "Banka" &&
      !formValues.bankPaymentMethodId &&
      selectableBankPaymentMethods.length > 0
    ) {
      form.setFieldValue(
        "bankPaymentMethodId",
        selectableBankPaymentMethods[0]!.id,
      );
    }

    if (
      formValues.paymentMethod !== "Banka" &&
      formValues.bankPaymentMethodId
    ) {
      form.setFieldValue("bankPaymentMethodId", "");
    }

    if (formValues.paymentMethod !== "Jine" && formValues.customPaymentMethod) {
      form.setFieldValue("customPaymentMethod", "");
    }
  }, [
    selectableBankPaymentMethods,
    form,
    formValues.bankPaymentMethodId,
    formValues.customPaymentMethod,
    formValues.paymentMethod,
  ]);

  // Customer dialog
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Use generated invoice number if user hasn't typed one
  const effectiveInvoiceNumber = formValues.invoiceNumber || nextInvoiceNumber;

  // ── Line item operations ────────────────────────────────────────
  const addItem = useCallback(() => {
    form.pushFieldValue("items", emptyLineItem(nextKey));
    setNextKey((k) => k + 1);
  }, [form, nextKey]);

  const removeItem = useCallback(
    (index: number) => {
      form.removeFieldValue("items", index);
    },
    [form],
  );

  const updateItem = useCallback(
    (index: number, field: keyof LineItem, value: string) => {
      form.setFieldValue("items", (prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      );
    },
    [form],
  );

  // ── Calculations ────────────────────────────────────────────────
  const totals = useMemo(() => {
    let subtotal = 0;
    let vatTotal = 0;
    let total = 0;
    for (const item of formValues.items) {
      const calc = calcLineItem(item, applyVat);
      subtotal += calc.subtotal;
      vatTotal += calc.vatAmount;
      total += calc.total;
    }
    return { subtotal, vatTotal, total };
  }, [applyVat, formValues.items]);

  const saveValidation = useMemo(
    () =>
      validateInvoiceForm(
        formValues,
        effectiveInvoiceNumber,
        project?.vatMode ?? "standard",
        Boolean(project),
        totals,
      ),
    [effectiveInvoiceNumber, formValues, project, totals],
  );

  const visibleValidationErrors = saveValidation.errors.slice(0, 4);

  // ── Save ────────────────────────────────────────────────────────
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setHasAttemptedSave(true);
    setSaveError(null);

    if (!project) {
      setSaveError("Projekt nebyl nalezen.");
      return;
    }

    if (
      !saveValidation.canSave ||
      !saveValidation.invoiceNumber ||
      !saveValidation.issueDate ||
      !saveValidation.taxableSupplyDate ||
      !saveValidation.dueDate ||
      saveValidation.subtotal === null ||
      saveValidation.vatTotal === null ||
      saveValidation.total === null
    ) {
      return;
    }

    void form.handleSubmit();
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-lg text-muted-foreground">
          Projekt &ldquo;{decodedName}&rdquo; nebyl nalezen.
        </p>
      </div>
    );
  }

  const currencyStr = formValues.currency || project.defaultCurrency || "CZK";

  return (
    <form onSubmit={handleSubmit}>
      <NewCustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onCreated={(id) => form.setFieldValue("customerId", id)}
        projectId={project.id}
      />
      <NewBankAccountDialog
        open={bankAccountDialogOpen}
        onClose={() => setBankAccountDialogOpen(false)}
        onCreated={(id) => form.setFieldValue("bankPaymentMethodId", id)}
        projectId={project.id}
      />

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight mb-1">
            Nová faktura
          </h1>
          <p className="text-sm text-muted-foreground">
            Projekt: {project.name}
          </p>
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Pole označená * jsou povinná.
          </p>
        </div>
      </div>

      {(saveError ||
        (hasAttemptedSave && visibleValidationErrors.length > 0)) && (
        <div
          className={cn(
            "mb-6 rounded-lg border px-4 py-3",
            saveError
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-muted/40",
          )}
        >
          <div className="flex gap-3">
            <AlertCircle
              className={cn(
                "mt-0.5 size-4 shrink-0",
                saveError ? "text-destructive" : "text-muted-foreground",
              )}
            />
            <div className="flex flex-col gap-1 text-sm">
              {saveError && (
                <p className="font-medium text-destructive">{saveError}</p>
              )}
              {visibleValidationErrors.length > 0 && (
                <>
                  <p className="font-medium text-foreground">
                    Pro uložení ještě doplňte:
                  </p>
                  <p className="text-muted-foreground">
                    {visibleValidationErrors.join(" ")}
                    {saveValidation.errors.length >
                    visibleValidationErrors.length
                      ? " A další pole."
                      : ""}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* ── Section: Zakladni udaje ─────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Základní údaje
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              label="Číslo faktury"
              required
              value={formValues.invoiceNumber}
              onChange={(e) =>
                form.setFieldValue("invoiceNumber", e.target.value)
              }
              placeholder={nextInvoiceNumber}
              className="font-mono"
              error={
                hasAttemptedSave && saveValidation.invoiceNumberInvalid
                  ? "Doplňte platné číslo faktury."
                  : undefined
              }
            />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider">
                Měna
              </Label>
              <Select
                value={formValues.currency}
                onValueChange={(value) => form.setFieldValue("currency", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CZK">CZK - Česká koruna</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Americký dolar</SelectItem>
                  <SelectItem value="GBP">GBP - Britská libra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Section: Odberatel ───────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Odběratel
          </h2>
          <div className="flex gap-3 items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider">
                Vyberte odběratele *
              </Label>
              <Select
                value={formValues.customerId}
                onValueChange={(value) =>
                  form.setFieldValue("customerId", value)
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={
                    hasAttemptedSave && saveValidation.customerMissing
                  }
                >
                  <SelectValue placeholder="-- Zvolte odběratele --" />
                </SelectTrigger>
                <SelectContent>
                  {projectCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.companyName && (
                        <span className="ml-1 text-muted-foreground">
                          ({c.companyName})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => setCustomerDialogOpen(true)}
              className="gap-1.5 shrink-0"
            >
              <UserPlus className="size-4" />
              Nový odběratel
            </Button>
          </div>
        </section>

        <Separator />

        {/* ── Section: Data ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Data
          </h2>
          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              applyVat ? "sm:grid-cols-3" : "sm:grid-cols-2 sm:max-w-2xl",
            )}
          >
            <DatePickerField
              label="Datum vystavení"
              value={formValues.issueDate}
              onChange={(value) => form.setFieldValue("issueDate", value)}
              invalid={hasAttemptedSave && saveValidation.issueDateInvalid}
              className={!applyVat ? "sm:max-w-xs" : undefined}
            />
            {applyVat && (
              <DatePickerField
                label="Datum zdanitelného plnění"
                value={formValues.taxableSupplyDate}
                onChange={(value) =>
                  form.setFieldValue("taxableSupplyDate", value)
                }
                invalid={
                  hasAttemptedSave && saveValidation.taxableSupplyDateInvalid
                }
              />
            )}
            <DatePickerField
              label="Datum splatnosti"
              value={formValues.dueDate}
              onChange={(value) => form.setFieldValue("dueDate", value)}
              invalid={hasAttemptedSave && saveValidation.dueDateInvalid}
              className={!applyVat ? "sm:max-w-xs" : undefined}
            />
          </div>
        </section>

        <Separator />

        {/* ── Section: Platebni metoda ─────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Platební metoda
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <FieldBlock
              label="Způsob úhrady"
              required
              error={
                hasAttemptedSave && saveValidation.paymentMethodInvalid
                  ? "Vyberte platební metodu."
                  : undefined
              }
            >
              <Select
                value={formValues.paymentMethod}
                onValueChange={(value) =>
                  form.setFieldValue("paymentMethod", value)
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={
                    hasAttemptedSave && saveValidation.paymentMethodInvalid
                  }
                >
                  <SelectValue placeholder="Vyberte platební metodu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Banka">Banka</SelectItem>
                  <SelectItem value="Hotove">Hotove</SelectItem>
                  <SelectItem value="Jine">Jine</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>

            {formValues.paymentMethod === "Banka" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FieldBlock
                  label="Bankovní účet"
                  required
                  className="flex-1"
                  error={
                    hasAttemptedSave && saveValidation.bankPaymentMethodInvalid
                      ? "Vyberte bankovní účet."
                      : undefined
                  }
                >
                  <Select
                    value={formValues.bankPaymentMethodId}
                    onValueChange={(value) =>
                      form.setFieldValue("bankPaymentMethodId", value)
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={
                        hasAttemptedSave &&
                        saveValidation.bankPaymentMethodInvalid
                      }
                    >
                      <SelectValue placeholder="Vyberte bankovní účet" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableBankPaymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                          {method.bankAccount ? ` (${method.bankAccount})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setBankAccountDialogOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="size-4" />
                  Nový účet
                </Button>
              </div>
            )}

            {formValues.paymentMethod === "Jine" && (
              <TextField
                label="Platební metoda"
                required
                value={formValues.customPaymentMethod}
                onChange={(e) =>
                  form.setFieldValue("customPaymentMethod", e.target.value)
                }
                placeholder="Např. Kartou"
                className="font-serif"
                error={
                  hasAttemptedSave && saveValidation.customPaymentMethodInvalid
                    ? "Doplňte platební metodu."
                    : undefined
                }
              />
            )}
          </div>
        </section>

        <Separator />

        {/* ── Section: Platebni symboly ───────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Platební symboly
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              label="Variabilní symbol"
              value={formValues.variableSymbol}
              onChange={(e) =>
                form.setFieldValue("variableSymbol", e.target.value)
              }
              placeholder={effectiveInvoiceNumber}
              maxLength={10}
              className="font-mono"
              error={
                hasAttemptedSave && saveValidation.variableSymbolInvalid
                  ? "Variabilní symbol může obsahovat jen číslice a max. 10 znaků."
                  : undefined
              }
            />
            <TextField
              label="Konstantní symbol"
              value={formValues.constantSymbol}
              onChange={(e) =>
                form.setFieldValue("constantSymbol", e.target.value)
              }
              placeholder="0308"
              maxLength={4}
              className="font-mono"
              error={
                hasAttemptedSave && saveValidation.constantSymbolInvalid
                  ? "Konstantní symbol může obsahovat jen číslice a max. 4 znaky."
                  : undefined
              }
            />
            <TextField
              label="Specifický symbol"
              value={formValues.specificSymbol}
              onChange={(e) =>
                form.setFieldValue("specificSymbol", e.target.value)
              }
              maxLength={10}
              className="font-mono"
              error={
                hasAttemptedSave && saveValidation.specificSymbolInvalid
                  ? "Specifický symbol může obsahovat jen číslice a max. 10 znaků."
                  : undefined
              }
            />
          </div>
        </section>

        <Separator />

        {/* ── Section: Polozky faktury ────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Položky faktury
            </h2>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={addItem}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Přidat položku
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs uppercase tracking-wider w-[40%]">
                  Popis *
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right w-[10%]">
                  Počet *
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider w-[10%]">
                  Jednotka
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right w-[15%]">
                  Cena/ks *
                </TableHead>
                {applyVat && (
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-right w-[10%]">
                    DPH % *
                  </TableHead>
                )}
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right w-[15%]">
                  Celkem
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {formValues.items.map((item, index) => {
                const calc = calcLineItem(item, applyVat);
                return (
                  <TableRow key={item.key}>
                    <TableCell className="p-1">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Popis položky..."
                        className="font-serif border-0 shadow-none focus-visible:ring-1 h-8"
                        aria-invalid={
                          hasAttemptedSave &&
                          Boolean(saveValidation.itemErrors.get(item.key))
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                        className="font-mono text-right border-0 shadow-none focus-visible:ring-1 h-8"
                        aria-invalid={
                          hasAttemptedSave &&
                          Boolean(saveValidation.itemErrors.get(item.key))
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, "unit", e.target.value)
                        }
                        placeholder="ks"
                        className="font-mono border-0 shadow-none focus-visible:ring-1 h-8"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", e.target.value)
                        }
                        className="font-mono text-right border-0 shadow-none focus-visible:ring-1 h-8"
                        aria-invalid={
                          hasAttemptedSave &&
                          Boolean(saveValidation.itemErrors.get(item.key))
                        }
                      />
                    </TableCell>
                    {applyVat && (
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.vatRate}
                          onChange={(e) =>
                            updateItem(index, "vatRate", e.target.value)
                          }
                          className="font-mono text-right border-0 shadow-none focus-visible:ring-1 h-8"
                          aria-invalid={
                            hasAttemptedSave &&
                            Boolean(saveValidation.itemErrors.get(item.key))
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono text-sm p-1 pr-2">
                      {formatCurrency(calc.total, currencyStr)}
                    </TableCell>
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formValues.items.length <= 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={applyVat ? 5 : 4}
                  className="text-right font-mono text-xs uppercase tracking-wider"
                >
                  Základ
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(totals.subtotal, currencyStr)}
                </TableCell>
                <TableCell />
              </TableRow>
              {applyVat && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-right font-mono text-xs uppercase tracking-wider"
                  >
                    DPH
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(totals.vatTotal, currencyStr)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
              <TableRow>
                <TableCell
                  colSpan={applyVat ? 5 : 4}
                  className="text-right font-serif text-base font-bold"
                >
                  Celkem
                </TableCell>
                <TableCell className="text-right font-mono text-base font-bold">
                  {formatCurrency(totals.total, currencyStr)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </section>

        <Separator />

        {/* ── Section: Poznamka ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Poznámka
          </h2>
          <Textarea
            value={formValues.note}
            onChange={(e) => form.setFieldValue("note", e.target.value)}
            placeholder="Volitelná poznámka k faktuře..."
            className="font-serif max-w-lg"
            rows={3}
          />
        </section>

        {/* ── Bottom save bar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <p className="text-sm text-muted-foreground font-serif italic">
            Faktura bude uložena jako koncept.
          </p>
          <Button
            type="submit"
            size="lg"
            className="gap-2"
            disabled={!saveValidation.canSave || isSubmitting}
          >
            <Save className="size-4" />
            Uložit fakturu
          </Button>
        </div>
      </div>
    </form>
  );
}

function NewInvoiceComponent() {
  return (
    <Suspense fallback={<NewInvoiceSkeleton />}>
      <NewInvoiceContent />
    </Suspense>
  );
}

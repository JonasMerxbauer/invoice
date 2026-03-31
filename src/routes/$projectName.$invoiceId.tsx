import { createFileRoute, Link } from "@tanstack/react-router";
import { evolu, useEvolu } from "~/evolu";
import * as Evolu from "@evolu/common";
import { useQuery } from "@evolu/react";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "~/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileText,
} from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/$projectName/$invoiceId")({
  component: InvoiceDetailComponent,
});

const allInvoices = evolu.createQuery((db) =>
  db.selectFrom("invoice").selectAll().where("isDeleted", "is", null),
);

const allInvoiceItems = evolu.createQuery((db) =>
  db
    .selectFrom("invoiceItem")
    .selectAll()
    .where("isDeleted", "is", null)
    .orderBy("sortOrder", "asc"),
);

const allProjects = evolu.createQuery((db) =>
  db.selectFrom("project").selectAll().where("isDeleted", "is", null),
);

// ── Status config ────────────────────────────────────────────────────
type InvoiceStatus = "draft" | "issued" | "overdue" | "paid" | "cancelled";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Koncept",
    className:
      "bg-muted text-muted-foreground border-muted-foreground/20 border",
  },
  issued: {
    label: "Vystavená",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30 border",
  },
  overdue: {
    label: "Po splatnosti",
    className: "bg-red-500/15 text-red-400 border-red-500/30 border",
  },
  paid: {
    label: "Zaplacená",
    className: "bg-green-500/15 text-green-400 border-green-500/30 border",
  },
  cancelled: {
    label: "Stornována",
    className:
      "bg-muted text-muted-foreground/60 border-muted-foreground/10 border line-through",
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(
  amount: number | null,
  currency: string | null,
): string {
  if (amount == null) return "\u2014";
  try {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: currency ?? "CZK",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency ?? "CZK"}`;
  }
}

const vatModeLabel = (mode: string | null) => {
  switch (mode) {
    case "standard":
      return "Standardní DPH";
    case "reverse-charge":
      return "Přenesená daňová povinnost";
    case "none":
      return "Bez DPH";
    default:
      return "\u2014";
  }
};

// ── Detail Field Component ───────────────────────────────────────────
function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </dt>
      <dd className={mono ? "font-mono text-sm" : "font-serif text-sm"}>
        {value || "\u2014"}
      </dd>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────
function InvoiceDetailComponent() {
  const { projectName, invoiceId } = Route.useParams();
  const { update } = useEvolu();

  const invoices = useQuery(allInvoices);
  const invoiceItems = useQuery(allInvoiceItems);
  const projects = useQuery(allProjects);

  const invoice = useMemo(
    () => invoices.find((inv) => inv.id === invoiceId),
    [invoices, invoiceId],
  );

  const items = useMemo(
    () =>
      invoice
        ? invoiceItems.filter((item) => item.invoiceId === invoice.id)
        : [],
    [invoiceItems, invoice],
  );

  const project = useMemo(
    () =>
      invoice?.projectId
        ? projects.find((p) => p.id === invoice.projectId)
        : null,
    [projects, invoice],
  );

  const handleStatusChange = (newStatus: string) => {
    if (!invoice) return;
    const updateData: any = {
      id: invoice.id,
      status: newStatus,
    };
    if (newStatus === "paid") {
      const paidDate = Evolu.DateIso.from(
        new Date().toISOString().split("T")[0]!,
      );
      if (paidDate.ok) {
        updateData.paidDate = paidDate.value;
      }
    }
    update("invoice", updateData);
  };

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <p className="font-serif text-lg text-muted-foreground mb-1">
          Faktura nebyla nalezena.
        </p>
        <Link
          to="/$projectName"
          params={{ projectName }}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Zpět na seznam faktur
        </Link>
      </div>
    );
  }

  const status = (invoice.status as InvoiceStatus) ?? "draft";
  const config = statusConfig[status] ?? statusConfig.draft;
  const currencyStr = invoice.currency ?? "CZK";

  // Snapshot fields are always populated — use them directly.
  const supplierCompanyName = invoice.supplierCompanyName;
  const supplierIco = invoice.supplierIco;
  const supplierDic = invoice.supplierDic;
  const supplierStreet = invoice.supplierStreet;
  const supplierCity = invoice.supplierCity;
  const supplierPostalCode = invoice.supplierPostalCode;
  const supplierBankAccount = invoice.supplierBankAccount;
  const supplierIban = invoice.supplierIban;
  const supplierSwift = invoice.supplierSwift;
  const customerName = invoice.customerName;
  const customerCompanyName = invoice.customerCompanyName;
  const customerIco = invoice.customerIco;
  const customerDic = invoice.customerDic;
  const customerStreet = invoice.customerStreet;
  const customerCity = invoice.customerCity;
  const customerPostalCode = invoice.customerPostalCode;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/$projectName"
              params={{ projectName }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Faktura {invoice.invoiceNumber}
            </h1>
            <Badge
              variant="ghost"
              className={`text-xs rounded-sm px-2.5 py-1 ${config.className}`}
            >
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            Projekt: {project?.name ?? projectName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Změnit stav" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Koncept</SelectItem>
              <SelectItem value="issued">Vystavená</SelectItem>
              <SelectItem value="paid">Zaplacená</SelectItem>
              <SelectItem value="overdue">Po splatnosti</SelectItem>
              <SelectItem value="cancelled">Stornována</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── Dodavatel (Supplier / Project) ──────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground font-normal">
              <Building2 className="size-3.5" />
              Dodavatel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-serif font-semibold">{supplierCompanyName}</p>
            {supplierIco && (
              <p className="text-xs font-mono text-muted-foreground">
                IČO: {supplierIco}
              </p>
            )}
            {supplierDic && (
              <p className="text-xs font-mono text-muted-foreground">
                DIČ: {supplierDic}
              </p>
            )}
            {supplierStreet && (
              <p className="text-sm text-muted-foreground">{supplierStreet}</p>
            )}
            {(supplierCity || supplierPostalCode) && (
              <p className="text-sm text-muted-foreground">
                {supplierPostalCode} {supplierCity}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Odberatel (Customer) ────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground font-normal">
              <Building2 className="size-3.5" />
              Odběratel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {customerName ? (
              <>
                <p className="font-serif font-semibold">{customerName}</p>
                {customerCompanyName && (
                  <p className="text-sm text-muted-foreground">
                    {customerCompanyName}
                  </p>
                )}
                {customerIco && (
                  <p className="text-xs font-mono text-muted-foreground">
                    IČO: {customerIco}
                  </p>
                )}
                {customerDic && (
                  <p className="text-xs font-mono text-muted-foreground">
                    DIČ: {customerDic}
                  </p>
                )}
                {customerStreet && (
                  <p className="text-sm text-muted-foreground">
                    {customerStreet}
                  </p>
                )}
                {(customerCity || customerPostalCode) && (
                  <p className="text-sm text-muted-foreground">
                    {customerPostalCode} {customerCity}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Odběratel nenalezen
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Platebni udaje ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground font-normal">
              <CreditCard className="size-3.5" />
              Platební údaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {supplierBankAccount && (
              <p className="text-sm">
                <span className="text-muted-foreground text-xs">Účet: </span>
                <span className="font-mono">{supplierBankAccount}</span>
              </p>
            )}
            {supplierIban && (
              <p className="text-sm">
                <span className="text-muted-foreground text-xs">IBAN: </span>
                <span className="font-mono">{supplierIban}</span>
              </p>
            )}
            {supplierSwift && (
              <p className="text-sm">
                <span className="text-muted-foreground text-xs">SWIFT: </span>
                <span className="font-mono">{supplierSwift}</span>
              </p>
            )}
            {invoice.variableSymbol && (
              <p className="text-sm">
                <span className="text-muted-foreground text-xs">VS: </span>
                <span className="font-mono">{invoice.variableSymbol}</span>
              </p>
            )}
            {invoice.constantSymbol && (
              <p className="text-sm">
                <span className="text-muted-foreground text-xs">KS: </span>
                <span className="font-mono">{invoice.constantSymbol}</span>
              </p>
            )}
            {invoice.specificSymbol && (
              <p className="text-sm">
                <span className="text-muted-foreground text-xs">SS: </span>
                <span className="font-mono">{invoice.specificSymbol}</span>
              </p>
            )}
            {!supplierBankAccount &&
              !supplierIban &&
              !invoice.variableSymbol && (
                <p className="text-sm text-muted-foreground italic">
                  Žádné platební údaje
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dates & Meta ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8 p-4 rounded-md bg-card border border-border/50">
        <DetailField
          label="Datum vystavení"
          value={formatDate(invoice.issueDate)}
        />
        <DetailField
          label="DUZP"
          value={formatDate(invoice.taxableSupplyDate)}
        />
        <DetailField
          label="Datum splatnosti"
          value={formatDate(invoice.dueDate)}
        />
        {invoice.paidDate && (
          <DetailField
            label="Datum zaplacení"
            value={formatDate(invoice.paidDate)}
          />
        )}
        <DetailField label="Měna" value={currencyStr} mono />
        <DetailField label="Režim DPH" value={vatModeLabel(invoice.vatMode)} />
      </div>

      <Separator className="mb-8" />

      {/* ── Line Items Table ──────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Položky faktury
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-8 text-center">
            Žádné položky
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  #
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Popis
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">
                  Počet
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Jednotka
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">
                  Cena/ks
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">
                  DPH %
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">
                  DPH
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">
                  Celkem
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-serif">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {item.unit || "\u2014"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.unitPrice, currencyStr)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.vatRate != null ? `${item.vatRate}%` : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.vatAmount, currencyStr)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(item.total, currencyStr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-right font-mono text-xs uppercase tracking-wider"
                >
                  Základ
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(invoice.subtotal, currencyStr)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-right font-mono text-xs uppercase tracking-wider"
                >
                  DPH celkem
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(invoice.vatTotal, currencyStr)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-right font-serif text-base font-bold"
                >
                  Celkem k úhradě
                </TableCell>
                <TableCell className="text-right font-mono text-base font-bold">
                  {formatCurrency(invoice.total, currencyStr)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </section>

      {/* ── Note ──────────────────────────────────────────────────── */}
      {invoice.note && (
        <>
          <Separator className="mb-6" />
          <section className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Poznámka
            </h2>
            <p className="font-serif text-sm text-muted-foreground whitespace-pre-line leading-relaxed max-w-lg">
              {invoice.note}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

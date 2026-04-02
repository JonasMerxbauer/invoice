import { createFileRoute, Link } from "@tanstack/react-router";
import { evolu } from "~/evolu";
import { useQueries } from "@evolu/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Plus, FileText, Receipt } from "lucide-react";
import { Suspense, useMemo } from "react";

const allProjects = evolu.createQuery((db) =>
  db.selectFrom("project").selectAll().where("isDeleted", "is", null),
);

const allInvoices = evolu.createQuery((db) =>
  db
    .selectFrom("invoice")
    .selectAll()
    .where("isDeleted", "is", null)
    .orderBy("issueDate", "desc"),
);

export const Route = createFileRoute("/$projectName/")({
  component: RouteComponent,
});

type InvoiceDisplayStatus = "issued" | "overdue" | "paid" | "cancelled";

const statusConfig: Record<
  InvoiceDisplayStatus,
  { label: string; className: string }
> = {
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

function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayIso(): string {
  return formatDateIso(new Date());
}

function getInvoiceDisplayStatus(invoice: {
  status: string | null;
  dueDate: string | null;
}): InvoiceDisplayStatus {
  if (invoice.status === "cancelled") return "cancelled";
  if (invoice.status === "paid") return "paid";
  if (invoice.dueDate && invoice.dueDate < getTodayIso()) return "overdue";
  return "issued";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("cs-CZ");
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

function ProjectInvoicesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="rounded-md border border-border/50 bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      <section className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <div className="rounded-md border border-border/50">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 border-b border-border/50 px-4 py-4 last:border-b-0"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectInvoicesContent() {
  const { projectName } = Route.useParams();
  const decodedName = decodeURIComponent(projectName);
  const [projects, invoices] = useQueries([allProjects, allInvoices]);

  // Find the project by name
  const project = useMemo(
    () => projects.find((p) => p.name === decodedName),
    [projects, decodedName],
  );

  // Filter invoices for this project
  const projectInvoices = useMemo(
    () =>
      project ? invoices.filter((inv) => inv.projectId === project.id) : [],
    [invoices, project],
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-lg text-muted-foreground">
          Projekt &ldquo;{decodedName}&rdquo; nebyl nalezen.
        </p>
        <Link to="/" className="mt-4 text-sm text-primary hover:underline">
          Zpět na projekty
        </Link>
      </div>
    );
  }

  // Calculate summary
  const totalAmount = projectInvoices.reduce(
    (sum, inv) => sum + (inv.total ?? 0),
    0,
  );
  const paidCount = projectInvoices.filter(
    (inv) => getInvoiceDisplayStatus(inv) === "paid",
  ).length;
  const unpaidCount = projectInvoices.filter((inv) => {
    const status = getInvoiceDisplayStatus(inv);
    return status === "issued" || status === "overdue";
  }).length;

  return (
    <div>
      {/* Project header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight mb-1">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.companyName}
            {project.ico && (
              <span className="ml-2 font-mono text-xs">IČO: {project.ico}</span>
            )}
          </p>
        </div>
        <Link to="/$projectName/new" params={{ projectName }}>
          <Button className="gap-2">
            <Plus className="size-4" />
            Nová faktura
          </Button>
        </Link>
      </div>

      {/* Summary strip */}
      {projectInvoices.length > 0 && (
        <div className="flex gap-6 mb-8 p-4 rounded-md bg-card border border-border/50">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Celkem faktur
            </p>
            <p className="text-lg font-serif font-bold">
              {projectInvoices.length}
            </p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Zaplaceno
            </p>
            <p className="text-lg font-serif font-bold text-green-400">
              {paidCount}
            </p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Nezaplaceno
            </p>
            <p className="text-lg font-serif font-bold text-amber-400">
              {unpaidCount}
            </p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Celková částka
            </p>
            <p className="text-lg font-mono font-bold">
              {formatCurrency(totalAmount, project.defaultCurrency)}
            </p>
          </div>
        </div>
      )}

      <Separator className="mb-6" />

      {/* Invoice list */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Faktury
        </h2>

        {projectInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Receipt className="size-8 text-muted-foreground" />
            </div>
            <p className="font-serif text-lg text-muted-foreground mb-1">
              Zatím žádné faktury
            </p>
            <p className="text-sm text-muted-foreground/70 mb-6">
              Vytvořte svou první fakturu pro tento projekt.
            </p>
            <Link to="/$projectName/new" params={{ projectName }}>
              <Button variant="outline" className="gap-2">
                <Plus className="size-4" />
                Vytvořit fakturu
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Číslo
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Odběratel
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Vystaveno
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Splatnost
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">
                  Stav
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">
                  Částka
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectInvoices.map((invoice) => {
                const status = getInvoiceDisplayStatus(invoice);
                const config = statusConfig[status];

                return (
                  <TableRow key={invoice.id} className="group">
                    <TableCell>
                      <Link
                        to="/$projectName/$invoiceId"
                        params={{
                          projectName,
                          invoiceId: invoice.id,
                        }}
                        className="flex items-center gap-2 font-mono text-sm hover:text-primary transition-colors"
                      >
                        <FileText className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-serif text-sm">
                      {invoice.customerName ?? (
                        <span className="text-muted-foreground italic">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="ghost"
                        className={`text-xs rounded-sm px-2 py-0.5 ${config.className}`}
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function RouteComponent() {
  return (
    <Suspense fallback={<ProjectInvoicesSkeleton />}>
      <ProjectInvoicesContent />
    </Suspense>
  );
}

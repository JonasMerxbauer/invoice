export type InvoiceNumberingScheme = "yearmonthnumber" | "yearnumber";

export type InvoiceNumberingInvoice = {
  projectId: string;
  invoiceNumber: string | null;
};

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getProjectInvoiceNumberingScheme(
  project: Record<string, any> | null | undefined,
): InvoiceNumberingScheme {
  return project?.invoiceNumberingScheme === "yearnumber"
    ? "yearnumber"
    : "yearmonthnumber";
}

export function getNextInvoiceNumber({
  invoices,
  issueDate,
  projectId,
  scheme,
}: {
  invoices: readonly InvoiceNumberingInvoice[];
  issueDate: string;
  projectId: string;
  scheme: InvoiceNumberingScheme;
}) {
  const date = parseIsoDate(issueDate) ?? new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = scheme === "yearnumber" ? year : `${year}${month}`;
  const suffixLength = scheme === "yearnumber" ? 4 : 2;
  const maxExistingSuffix = invoices.reduce((max, invoice) => {
    if (invoice.projectId !== projectId) return max;
    if (!invoice.invoiceNumber?.startsWith(prefix)) return max;

    const suffix = Number(invoice.invoiceNumber.slice(prefix.length));
    if (!Number.isInteger(suffix) || suffix < 1) return max;

    return Math.max(max, suffix);
  }, 0);
  const nextNumber = maxExistingSuffix + 1;

  return `${prefix}${String(nextNumber).padStart(suffixLength, "0")}`;
}

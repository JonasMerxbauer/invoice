import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type InvoicePdfInvoice = {
  invoiceNumber: string | null;
  issueDate: string | null;
  taxableSupplyDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  currency: string | null;
  vatMode: string | null;
  variableSymbol: string | null;
  constantSymbol: string | null;
  specificSymbol: string | null;
  subtotal: number | null;
  vatTotal: number | null;
  total: number | null;
  note: string | null;
  supplierCompanyName: string | null;
  supplierIco: string | null;
  supplierDic: string | null;
  supplierVatId: string | null;
  supplierStreet: string | null;
  supplierCity: string | null;
  supplierPostalCode: string | null;
  supplierCountry: string | null;
  supplierBankAccount: string | null;
  supplierIban: string | null;
  supplierSwift: string | null;
  customerName: string | null;
  customerCompanyName: string | null;
  customerIco: string | null;
  customerDic: string | null;
  customerStreet: string | null;
  customerCity: string | null;
  customerPostalCode: string | null;
  customerCountry: string | null;
};

export type InvoicePdfItem = {
  id: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  total: number | null;
};

const PDF_SERIF_FAMILY = "InvoicePdfLibreBaskerville";
const PDF_MONO_FAMILY = "InvoicePdfOpenSansMono";

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
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
): string | null {
  if (amount == null) return null;
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

function formatNumber(value: number | null): string | null {
  if (value == null) return null;
  try {
    return new Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return String(value);
  }
}

function vatModeLabel(mode: string | null) {
  switch (mode) {
    case "standard":
      return "Standardní DPH";
    case "reverse-charge":
      return "Přenesená daňová povinnost";
    case "none":
      return "Bez DPH";
    default:
      return null;
  }
}

function joinAddressLine(
  ...parts: Array<string | null | undefined>
): string | null {
  const value = parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return value || null;
}

function buildPartyLines({
  name,
  companyName,
  ico,
  dic,
  vatId,
  street,
  postalCode,
  city,
  country,
}: {
  name?: string | null;
  companyName?: string | null;
  ico?: string | null;
  dic?: string | null;
  vatId?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  return [
    name,
    companyName,
    ico ? `IČO: ${ico}` : null,
    dic ? `DIČ: ${dic}` : null,
    vatId ? `VAT ID: ${vatId}` : null,
    street,
    joinAddressLine(postalCode, city),
    country,
  ].filter(Boolean) as string[];
}

const invoicePdfStyles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 42,
    fontFamily: PDF_SERIF_FAMILY,
    fontSize: 10,
    color: "#18181b",
    lineHeight: 1.45,
  },
  header: {
    alignItems: "flex-end",
    marginBottom: 34,
  },
  headerBlock: {
    width: "44%",
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    gap: 6,
  },
  title: {
    fontSize: 25,
    fontWeight: 700,
    paddingRight: 20,
    textAlign: "right",
  },
  titleNumber: {
    fontSize: 25,
    fontWeight: 700,
    color: "#4b5563",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 10,
    color: "#52525b",
    textAlign: "right",
  },
  status: {
    marginTop: 8,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#71717a",
    textAlign: "right",
    fontFamily: PDF_MONO_FAMILY,
  },
  sectionGrid: {
    flexDirection: "row",
    gap: 44,
    marginBottom: 22,
  },
  sectionColumn: {
    flexGrow: 1,
    flexBasis: 0,
  },
  sectionRule: {
    width: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 2,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#52525b",
    fontFamily: PDF_MONO_FAMILY,
  },
  partyPrimary: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 3,
  },
  mutedText: {
    color: "#52525b",
  },
  partyLine: {
    marginBottom: 2,
  },
  emptyText: {
    color: "#71717a",
    fontStyle: "italic",
  },
  detailGrid: {
    flexDirection: "row",
    gap: 44,
    marginBottom: 26,
  },
  detailColumn: {
    flexGrow: 1,
    flexBasis: 0,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 5,
  },
  detailLabel: {
    color: "#52525b",
  },
  detailValue: {
    textAlign: "right",
  },
  mono: {
    fontFamily: PDF_MONO_FAMILY,
  },
  itemsTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#52525b",
    marginBottom: 10,
    fontFamily: PDF_MONO_FAMILY,
  },
  table: {
    marginBottom: 26,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeader: {
    paddingBottom: 0,
  },
  tableCell: {
    paddingVertical: 8,
    justifyContent: "center",
  },
  colDescription: {
    flexGrow: 1,
    paddingRight: 12,
  },
  colTotal: {
    width: 150,
  },
  tableHeaderText: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: PDF_MONO_FAMILY,
    color: "#3f3f46",
    lineHeight: 1,
  },
  rightAligned: {
    textAlign: "right",
  },
  itemDescription: {
    fontSize: 10.5,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 8.5,
    color: "#52525b",
  },
  totalSection: {
    alignItems: "flex-end",
  },
  totalBlock: {
    width: 190,
    paddingTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  totalsLabel: {
    fontFamily: PDF_MONO_FAMILY,
    fontSize: 8.5,
    color: "#52525b",
    textTransform: "uppercase",
  },
  totalsValue: {
    textAlign: "right",
    fontFamily: PDF_MONO_FAMILY,
    fontSize: 10,
  },
  totalDueLabel: {
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1,
  },
  totalDueValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#4b5563",
    lineHeight: 1,
  },
  noteSection: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: "#d4d4d8",
    paddingTop: 12,
  },
});

export function InvoicePdfDocument({
  invoice,
  items,
}: {
  invoice: InvoicePdfInvoice;
  items: InvoicePdfItem[];
}) {
  const supplierLines = buildPartyLines({
    name: invoice.supplierCompanyName,
    ico: invoice.supplierIco,
    dic: invoice.supplierDic,
    vatId: invoice.supplierVatId,
    street: invoice.supplierStreet,
    postalCode: invoice.supplierPostalCode,
    city: invoice.supplierCity,
    country: invoice.supplierCountry,
  });

  const customerLines = buildPartyLines({
    name: invoice.customerName,
    companyName: invoice.customerCompanyName,
    ico: invoice.customerIco,
    dic: invoice.customerDic,
    street: invoice.customerStreet,
    postalCode: invoice.customerPostalCode,
    city: invoice.customerCity,
    country: invoice.customerCountry,
  });

  const paymentLines = [
    invoice.supplierBankAccount ? `Účet: ${invoice.supplierBankAccount}` : null,
    invoice.supplierIban ? `IBAN: ${invoice.supplierIban}` : null,
    invoice.supplierSwift ? `SWIFT: ${invoice.supplierSwift}` : null,
    invoice.variableSymbol ? `VS: ${invoice.variableSymbol}` : null,
    invoice.constantSymbol ? `KS: ${invoice.constantSymbol}` : null,
    invoice.specificSymbol ? `SS: ${invoice.specificSymbol}` : null,
  ].filter(Boolean) as string[];
  const isVatPayer = invoice.vatMode !== "none";
  const vatModeValue = vatModeLabel(invoice.vatMode);

  const leftDetails = [
    ...(invoice.supplierIco
      ? [{ label: "IČO", value: invoice.supplierIco, mono: true }]
      : []),
    ...(invoice.supplierVatId || invoice.supplierDic
      ? [
          {
            label: invoice.supplierVatId ? "VAT ID" : "DIČ",
            value: invoice.supplierVatId ?? invoice.supplierDic,
            mono: true,
          },
        ]
      : []),
    ...(invoice.constantSymbol
      ? [
          {
            label: "Konstantní symbol",
            value: invoice.constantSymbol,
            mono: true,
          },
        ]
      : []),
    ...(invoice.specificSymbol
      ? [
          {
            label: "Specifický symbol",
            value: invoice.specificSymbol,
            mono: true,
          },
        ]
      : []),
    ...(invoice.supplierBankAccount
      ? [
          {
            label: "Bankovní účet",
            value: invoice.supplierBankAccount,
            mono: true,
          },
        ]
      : []),
    ...(invoice.variableSymbol
      ? [
          {
            label: "Variabilní symbol",
            value: invoice.variableSymbol,
            mono: true,
          },
        ]
      : []),
    ...(invoice.supplierIban
      ? [{ label: "IBAN", value: invoice.supplierIban, mono: true }]
      : []),
    ...(invoice.supplierSwift
      ? [{ label: "SWIFT", value: invoice.supplierSwift, mono: true }]
      : []),
  ];

  const rightDetails = [
    ...(invoice.customerIco
      ? [{ label: "IČO", value: invoice.customerIco, mono: true }]
      : []),
    ...(invoice.issueDate
      ? [{ label: "Datum vystavení", value: formatDate(invoice.issueDate) }]
      : []),
    ...(invoice.dueDate
      ? [{ label: "Datum splatnosti", value: formatDate(invoice.dueDate) }]
      : []),
    ...(isVatPayer
      ? invoice.taxableSupplyDate
        ? [{ label: "DUZP", value: formatDate(invoice.taxableSupplyDate) }]
        : []
      : []),
    ...(invoice.paidDate
      ? [{ label: "Datum zaplacení", value: formatDate(invoice.paidDate) }]
      : []),
    ...(isVatPayer
      ? vatModeValue
        ? [{ label: "Režim DPH", value: vatModeValue }]
        : []
      : []),
  ];

  const totals = [
    ...(isVatPayer
      ? [
          {
            label: "Základ",
            value: formatCurrency(invoice.subtotal, invoice.currency),
          },
        ]
      : []),
    ...(isVatPayer
      ? [
          {
            label: "DPH celkem",
            value: formatCurrency(invoice.vatTotal, invoice.currency),
          },
        ]
      : []),
    {
      label: "Celkem k úhradě",
      value: formatCurrency(invoice.total, invoice.currency),
      highlight: true,
    },
  ].filter((field) => field.value);

  return (
    <Document title={`Faktura ${invoice.invoiceNumber ?? ""}`}>
      <Page size="A4" style={invoicePdfStyles.page}>
        <View style={invoicePdfStyles.header}>
          <View style={invoicePdfStyles.headerBlock}>
            <View style={invoicePdfStyles.titleRow}>
              <Text style={invoicePdfStyles.title}>Faktura</Text>
              {invoice.invoiceNumber && (
                <Text style={invoicePdfStyles.titleNumber}>
                  {invoice.invoiceNumber}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={invoicePdfStyles.sectionGrid}>
          <View style={invoicePdfStyles.sectionColumn}>
            <Text style={invoicePdfStyles.sectionTitle}>Dodavatel</Text>
            {supplierLines.length > 0 ? (
              supplierLines.map((line, index) => (
                <Text
                  key={`supplier-${index}`}
                  style={[
                    index === 0
                      ? invoicePdfStyles.partyPrimary
                      : invoicePdfStyles.mutedText,
                    invoicePdfStyles.partyLine,
                  ]}
                >
                  {line}
                </Text>
              ))
            ) : (
              <Text style={invoicePdfStyles.emptyText}>
                Dodavatel nenalezen
              </Text>
            )}
          </View>

          <View style={invoicePdfStyles.sectionColumn}>
            <Text style={invoicePdfStyles.sectionTitle}>Odběratel</Text>
            {customerLines.length > 0 ? (
              customerLines.map((line, index) => (
                <Text
                  key={`customer-${index}`}
                  style={[
                    index === 0
                      ? invoicePdfStyles.partyPrimary
                      : invoicePdfStyles.mutedText,
                    invoicePdfStyles.partyLine,
                  ]}
                >
                  {line}
                </Text>
              ))
            ) : (
              <Text style={invoicePdfStyles.emptyText}>
                Odběratel nenalezen
              </Text>
            )}
          </View>
        </View>

        <View style={invoicePdfStyles.detailGrid}>
          <View style={invoicePdfStyles.detailColumn}>
            {leftDetails.length > 0 ? (
              leftDetails.map((field) => (
                <View key={field.label} style={invoicePdfStyles.detailRow}>
                  <Text style={invoicePdfStyles.detailLabel}>
                    {field.label}
                  </Text>
                  <Text
                    style={
                      field.mono
                        ? [invoicePdfStyles.detailValue, invoicePdfStyles.mono]
                        : invoicePdfStyles.detailValue
                    }
                  >
                    {field.value}
                  </Text>
                </View>
              ))
            ) : paymentLines.length > 0 ? (
              paymentLines.map((line, index) => (
                <Text
                  key={`payment-${index}`}
                  style={[
                    invoicePdfStyles.mutedText,
                    invoicePdfStyles.partyLine,
                  ]}
                >
                  {line}
                </Text>
              ))
            ) : (
              <Text style={invoicePdfStyles.emptyText}>
                Žádné platební údaje
              </Text>
            )}
          </View>

          <View style={invoicePdfStyles.detailColumn}>
            {rightDetails.map((field) => (
              <View key={field.label} style={invoicePdfStyles.detailRow}>
                <Text style={invoicePdfStyles.detailLabel}>{field.label}</Text>
                <Text
                  style={
                    field.mono
                      ? [invoicePdfStyles.detailValue, invoicePdfStyles.mono]
                      : invoicePdfStyles.detailValue
                  }
                >
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {items.length === 0 ? (
          <Text style={invoicePdfStyles.emptyText}>Žádné položky</Text>
        ) : (
          <View style={invoicePdfStyles.table}>
            <View
              style={[invoicePdfStyles.tableRow, invoicePdfStyles.tableHeader]}
            >
              <View
                style={[
                  invoicePdfStyles.tableCell,
                  invoicePdfStyles.colDescription,
                ]}
              >
                <Text style={invoicePdfStyles.tableHeaderText}>
                  Popis položky
                </Text>
              </View>
              <View
                style={[invoicePdfStyles.tableCell, invoicePdfStyles.colTotal]}
              >
                <Text
                  style={[
                    invoicePdfStyles.tableHeaderText,
                    invoicePdfStyles.rightAligned,
                  ]}
                >
                  Cena
                </Text>
              </View>
            </View>

            {items.map((item, index) => {
              const rowStyle =
                index === items.length - 1
                  ? [invoicePdfStyles.tableRow, invoicePdfStyles.tableRowLast]
                  : invoicePdfStyles.tableRow;
              const itemMeta = [
                item.quantity != null
                  ? `Množství: ${formatNumber(item.quantity)}${item.unit ? ` ${item.unit}` : ""}`
                  : null,
                item.unitPrice != null
                  ? `Cena/ks: ${formatCurrency(item.unitPrice, invoice.currency)}`
                  : null,
                isVatPayer && item.vatRate != null
                  ? `DPH: ${formatNumber(item.vatRate)}%`
                  : null,
              ].filter(Boolean);

              return (
                <View key={item.id} style={rowStyle}>
                  <View
                    style={[
                      invoicePdfStyles.tableCell,
                      invoicePdfStyles.colDescription,
                    ]}
                  >
                    <Text style={invoicePdfStyles.itemDescription}>
                      {item.description || `Položka ${index + 1}`}
                    </Text>
                    {itemMeta.length > 0 && (
                      <Text style={invoicePdfStyles.itemMeta}>
                        {itemMeta.join("   |   ")}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      invoicePdfStyles.tableCell,
                      invoicePdfStyles.colTotal,
                    ]}
                  >
                    <Text
                      style={[
                        invoicePdfStyles.mono,
                        invoicePdfStyles.rightAligned,
                      ]}
                    >
                      {formatCurrency(item.total, invoice.currency) ?? ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={invoicePdfStyles.totalSection}>
          <View style={invoicePdfStyles.totalBlock}>
            {totals.map((field) => (
              <View key={field.label} style={invoicePdfStyles.totalsRow}>
                <Text
                  style={[
                    invoicePdfStyles.totalsLabel,
                    field.highlight ? invoicePdfStyles.totalDueLabel : {},
                  ]}
                >
                  {field.label}
                </Text>
                <Text
                  style={[
                    invoicePdfStyles.totalsValue,
                    field.highlight ? invoicePdfStyles.totalDueValue : {},
                  ]}
                >
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {invoice.note && (
          <View style={invoicePdfStyles.noteSection}>
            <Text style={invoicePdfStyles.sectionTitle}>Poznámka</Text>
            <Text style={invoicePdfStyles.mutedText}>{invoice.note}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

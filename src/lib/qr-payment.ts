import type { InvoicePdfInvoice } from "~/components/invoice-pdf-document";

const SPAYD_VERSION = "SPD*1.0";

function normalizeIban(value: string | null): string | null {
  const iban = value?.replace(/\s+/g, "").toUpperCase() ?? "";
  return iban.length > 0 ? iban : null;
}

function mod97(value: string): number {
  let remainder = 0;

  for (const char of value) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }

  return remainder;
}

function buildCzechIbanFromBankAccount(value: string | null): string | null {
  const bankAccount = value?.replace(/\s+/g, "") ?? "";
  const match = /^(?:(\d{1,6})-)?(\d{1,10})\/(\d{4})$/.exec(bankAccount);
  if (!match) return null;

  const prefix = (match[1] ?? "").padStart(6, "0");
  const accountNumber = match[2].padStart(10, "0");
  const bankCode = match[3];
  const bban = `${bankCode}${prefix}${accountNumber}`;
  const checksum = String(98 - mod97(`${bban}123500`)).padStart(2, "0");

  return `CZ${checksum}${bban}`;
}

function normalizeCurrency(value: string | null): string | null {
  const currency = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function normalizeAmount(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value.toFixed(2);
}

function normalizeSymbol(value: string | null): string | null {
  const symbol = value?.replace(/\D/g, "") ?? "";
  return symbol.length > 0 ? symbol : null;
}

function formatSpaydDate(value: string | null): string | null {
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnly) return `${dateOnly[1]}${dateOnly[2]}${dateOnly[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function buildQrPaymentPayload(invoice: InvoicePdfInvoice): string | null {
  const iban =
    normalizeIban(invoice.supplierIban) ??
    buildCzechIbanFromBankAccount(invoice.supplierBankAccount);
  const amount = normalizeAmount(invoice.total);
  const currency = normalizeCurrency(invoice.currency);

  if (!iban || !amount || !currency) return null;

  const dueDate = formatSpaydDate(invoice.dueDate);
  const variableSymbol = normalizeSymbol(invoice.variableSymbol);
  const constantSymbol = normalizeSymbol(invoice.constantSymbol);
  const specificSymbol = normalizeSymbol(invoice.specificSymbol);

  const fields = [
    `ACC:${iban}`,
    `AM:${amount}`,
    `CC:${currency}`,
    dueDate ? `DT:${dueDate}` : null,
    variableSymbol ? `X-VS:${variableSymbol}` : null,
    constantSymbol ? `X-KS:${constantSymbol}` : null,
    specificSymbol ? `X-SS:${specificSymbol}` : null,
  ].filter(Boolean);

  return [SPAYD_VERSION, ...fields].join("*");
}

export async function createQrPaymentDataUrl(
  invoice: InvoicePdfInvoice,
): Promise<string | null> {
  const payload = buildQrPaymentPayload(invoice);
  if (!payload) return null;

  const { toDataURL } = await import("qrcode");

  return toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    type: "image/png",
    width: 260,
  });
}

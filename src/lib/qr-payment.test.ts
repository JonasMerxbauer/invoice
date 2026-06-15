import { describe, expect, it } from "vitest";
import { buildQrPaymentPayload } from "~/lib/qr-payment";
import type { InvoicePdfInvoice } from "~/components/invoice-pdf-document";

function invoice(overrides: Partial<InvoicePdfInvoice>): InvoicePdfInvoice {
  return {
    invoiceNumber: null,
    issueDate: null,
    taxableSupplyDate: null,
    dueDate: null,
    paidDate: null,
    currency: null,
    vatMode: null,
    variableSymbol: null,
    constantSymbol: null,
    specificSymbol: null,
    subtotal: null,
    vatTotal: null,
    total: null,
    note: null,
    supplierCompanyName: null,
    supplierIco: null,
    supplierDic: null,
    supplierVatId: null,
    supplierStreet: null,
    supplierCity: null,
    supplierPostalCode: null,
    supplierCountry: null,
    supplierBankAccount: null,
    supplierIban: null,
    supplierSwift: null,
    customerName: null,
    customerCompanyName: null,
    customerIco: null,
    customerDic: null,
    customerStreet: null,
    customerCity: null,
    customerPostalCode: null,
    customerCountry: null,
    ...overrides,
  };
}

describe("buildQrPaymentPayload", () => {
  it("builds a SPAYD payload for invoice payment", () => {
    expect(
      buildQrPaymentPayload(
        invoice({
          supplierIban: "CZ65 0800 0000 1920 0014 5399",
          total: 1210,
          currency: "czk",
          dueDate: "2026-06-15",
          variableSymbol: "2024001",
          constantSymbol: "0308",
          specificSymbol: "99",
        }),
      ),
    ).toBe(
      "SPD*1.0*ACC:CZ6508000000192000145399*AM:1210.00*CC:CZK*DT:20260615*X-VS:2024001*X-KS:0308*X-SS:99",
    );
  });

  it("returns null when required payment fields are missing", () => {
    expect(
      buildQrPaymentPayload(
        invoice({
          total: 1210,
          currency: "CZK",
        }),
      ),
    ).toBeNull();
  });

  it("derives a Czech IBAN from a domestic bank account", () => {
    expect(
      buildQrPaymentPayload(
        invoice({
          supplierBankAccount: "19-2000145399/0800",
          total: 1210,
          currency: "CZK",
        }),
      ),
    ).toBe("SPD*1.0*ACC:CZ6508000000192000145399*AM:1210.00*CC:CZK");
  });
});

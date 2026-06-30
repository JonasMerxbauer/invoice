import { describe, expect, it } from "vitest";
import { getNextInvoiceNumber } from "./invoice-numbering";

describe("getNextInvoiceNumber", () => {
  it("increments monthly invoice numbers from the existing suffix", () => {
    expect(
      getNextInvoiceNumber({
        projectId: "project-1",
        issueDate: "2026-06-30",
        scheme: "yearmonthnumber",
        invoices: [
          {
            projectId: "project-1",
            invoiceNumber: "20260601",
          },
        ],
      }),
    ).toBe("20260602");
  });

  it("keeps monthly invoice numbers scoped to the selected month", () => {
    expect(
      getNextInvoiceNumber({
        projectId: "project-1",
        issueDate: "2026-07-01",
        scheme: "yearmonthnumber",
        invoices: [
          {
            projectId: "project-1",
            invoiceNumber: "20260601",
          },
        ],
      }),
    ).toBe("20260701");
  });

  it("increments yearly invoice numbers from the existing suffix", () => {
    expect(
      getNextInvoiceNumber({
        projectId: "project-1",
        issueDate: "2026-06-30",
        scheme: "yearnumber",
        invoices: [
          {
            projectId: "project-1",
            invoiceNumber: "20260001",
          },
        ],
      }),
    ).toBe("20260002");
  });
});

import { describe, expect, it } from "vitest";
import {
  classifyCompanyLookupQuery,
  normalizeAresSubject,
  normalizeAresSubjects,
} from "~/lib/company-registry";

describe("classifyCompanyLookupQuery", () => {
  it("classifies exactly 8 digits as IČO lookup", () => {
    expect(classifyCompanyLookupQuery("12345678")).toEqual({
      mode: "ico",
      query: "12345678",
    });
  });

  it("classifies two or more non-digit characters as name lookup", () => {
    expect(classifyCompanyLookupQuery("Ac")).toEqual({
      mode: "name",
      query: "Ac",
    });
  });

  it("ignores short, empty, and partial digit queries", () => {
    expect(classifyCompanyLookupQuery("A")).toBeNull();
    expect(classifyCompanyLookupQuery("   ")).toBeNull();
    expect(classifyCompanyLookupQuery("1234567")).toBeNull();
  });
});

describe("normalizeAresSubject", () => {
  it("maps ARES identity and structured address fields", () => {
    expect(
      normalizeAresSubject({
        obchodniJmeno: "  Acme s.r.o.  ",
        ico: " 12345678 ",
        dic: " cz12345678 ",
        sidlo: {
          nazevUlice: "Dlouhá",
          cisloDomovni: "12",
          cisloOrientacni: "4",
          nazevObce: "Praha",
          psc: "110 00",
          kodStatu: "CZ",
        },
      }),
    ).toEqual({
      id: "12345678",
      name: "Acme s.r.o.",
      ico: "12345678",
      dic: "CZ12345678",
      street: "Dlouhá 12/4",
      city: "Praha",
      postalCode: "11000",
      country: "Česká republika",
      fullAddress: "Dlouhá 12/4, 11000 Praha, Česká republika",
      isActive: true,
    });
  });

  it("marks terminated subjects as inactive", () => {
    expect(
      normalizeAresSubject({
        obchodniJmeno: "Zaniklá s.r.o.",
        ico: "87654321",
        datumZaniku: "2024-01-01",
      }),
    ).toMatchObject({ isActive: false });
  });
});

describe("normalizeAresSubjects", () => {
  it("drops invalid subjects and deduplicates by IČO", () => {
    expect(
      normalizeAresSubjects([
        { obchodniJmeno: "Acme", ico: "12345678" },
        { obchodniJmeno: "Acme duplicate", ico: "12345678" },
        { obchodniJmeno: "Missing IČO" },
      ]),
    ).toHaveLength(1);
  });
});

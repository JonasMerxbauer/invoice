export type CompanyLookupMode = "ico" | "name";

export type CompanyLookupQuery = {
  mode: CompanyLookupMode;
  query: string;
};

export type CompanyLookupResult = {
  id: string;
  name: string;
  ico: string;
  dic: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  fullAddress: string | null;
  isActive: boolean;
};

const CZECH_COUNTRY = "Česká republika";

export function classifyCompanyLookupQuery(
  value: string,
): CompanyLookupQuery | null {
  const query = value.trim();
  if (!query) return null;

  if (/^\d{8}$/.test(query)) {
    return { mode: "ico", query };
  }

  if (query.length >= 2 && !/^\d+$/.test(query)) {
    return { mode: "name", query };
  }

  return null;
}

export function normalizeCompanyIdentifier(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const normalized = String(value).replace(/\s+/g, "").trim();
  return normalized || null;
}

export function normalizeDic(value: unknown): string | null {
  const normalized = normalizeCompanyIdentifier(value);
  return normalized ? normalized.toUpperCase() : null;
}

export function normalizeAresSubject(subject: unknown): CompanyLookupResult | null {
  if (!subject || typeof subject !== "object") return null;

  const record = subject as Record<string, any>;
  const name = normalizeText(record.obchodniJmeno ?? record.nazev);
  const ico = normalizeCompanyIdentifier(record.ico);
  if (!name || !ico) return null;

  const address = normalizeAresAddress(record.sidlo);

  return {
    id: ico,
    name,
    ico,
    dic: normalizeDic(record.dic),
    street: address.street,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    fullAddress: address.fullAddress,
    isActive: !record.datumZaniku,
  };
}

export function normalizeAresSubjects(subjects: unknown): CompanyLookupResult[] {
  if (!Array.isArray(subjects)) return [];

  const results = new Map<string, CompanyLookupResult>();

  for (const subject of subjects) {
    const normalized = normalizeAresSubject(subject);
    if (!normalized) continue;
    if (!results.has(normalized.ico)) results.set(normalized.ico, normalized);
  }

  return [...results.values()];
}

function normalizeAresAddress(address: unknown) {
  if (!address || typeof address !== "object") {
    return {
      street: null,
      city: null,
      postalCode: null,
      country: CZECH_COUNTRY,
      fullAddress: null,
    };
  }

  const record = address as Record<string, any>;
  const streetName = normalizeText(record.nazevUlice);
  const houseNumber = normalizeText(record.cisloDomovni);
  const orientationNumber = normalizeText(record.cisloOrientacni);
  const orientationLetter = normalizeText(record.cisloOrientacniPismeno);
  const orientation = [orientationNumber, orientationLetter]
    .filter(Boolean)
    .join("");
  const street = joinAddressParts(
    streetName ?? normalizeText(record.nazevCastiObce),
    joinAddressNumbers(houseNumber, orientation),
  );
  const fallbackAddress = normalizeText(record.textovaAdresa);
  const city = normalizeText(record.nazevObce ?? record.nazevCastiObce);
  const postalCode = normalizePostalCode(record.psc);
  const country = normalizeCountry(record.nazevStatu ?? record.kodStatu);
  const composedAddress = [street, joinAddressParts(postalCode, city), country]
    .filter(Boolean)
    .join(", ");
  const fullAddress = fallbackAddress ?? (composedAddress || null);

  return {
    street: street ?? fallbackAddress,
    city,
    postalCode,
    country,
    fullAddress,
  };
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized || null;
}

function normalizePostalCode(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized ? normalized.replace(/\s+/g, "") : null;
}

function normalizeCountry(value: unknown): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return CZECH_COUNTRY;

  return normalized.toUpperCase() === "CZ" || normalized === "Česko"
    ? CZECH_COUNTRY
    : normalized;
}

function joinAddressNumbers(
  houseNumber: string | null,
  orientation: string | null,
): string | null {
  if (houseNumber && orientation) return `${houseNumber}/${orientation}`;
  return houseNumber ?? orientation;
}

function joinAddressParts(...parts: Array<string | null>): string | null {
  const value = parts.filter(Boolean).join(" ");
  return value || null;
}

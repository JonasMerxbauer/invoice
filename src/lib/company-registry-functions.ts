import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  type CompanyLookupResult,
  normalizeAresSubject,
  normalizeAresSubjects,
} from "~/lib/company-registry";

const ARES_BASE_URL =
  "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

const lookupInputSchema = z.object({
  mode: z.enum(["ico", "name"]),
  query: z.string().trim().min(1),
});

export const lookupCompanyRegistry = createServerFn({ method: "GET" })
  .inputValidator((input) => lookupInputSchema.parse(input))
  .handler(async ({ data }) => lookupAres(data));

async function lookupAres(data: z.infer<typeof lookupInputSchema>) {
  try {
    if (data.mode === "ico") {
      const result = await fetchAresSubjectByIco(data.query);
      return result ? [result] : [];
    }

    const results = await searchAresSubjectsByName(data.query);
    return results.filter((result) => result.isActive).slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchAresSubjectByIco(
  ico: string,
): Promise<CompanyLookupResult | null> {
  const response = await fetch(`${ARES_BASE_URL}/${encodeURIComponent(ico)}`, {
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) return null;

  return normalizeAresSubject(await response.json());
}

async function searchAresSubjectsByName(
  query: string,
): Promise<CompanyLookupResult[]> {
  const response = await fetch(`${ARES_BASE_URL}/vyhledat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ obchodniJmeno: query, start: 0, pocet: 8 }),
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { ekonomickeSubjekty?: unknown };
  return normalizeAresSubjects(payload.ekonomickeSubjekty);
}

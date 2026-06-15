import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import {
  type CompanyLookupResult,
  classifyCompanyLookupQuery,
} from "~/lib/company-registry";
import { lookupCompanyRegistry } from "~/lib/company-registry-functions";

const lookupCache = new Map<string, CompanyLookupResult[]>();

type LookupState = {
  cacheKey: string;
  results: CompanyLookupResult[];
};

export function CompanyRegistryLookupInput({
  label,
  value,
  onChange,
  onSelect,
  required,
  placeholder,
  className,
  wrapperClassName,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: CompanyLookupResult) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  error?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const lookup = useServerFn(lookupCompanyRegistry);
  const [lookupState, setLookupState] = useState<LookupState | null>(null);
  const [focused, setFocused] = useState(false);
  const classified = classifyCompanyLookupQuery(value);
  const lookupMode = classified?.mode;
  const lookupQuery = classified?.query;
  const cacheKey =
    lookupMode && lookupQuery
      ? `${lookupMode}:${lookupQuery.toLocaleLowerCase("cs-CZ")}`
      : null;
  const cachedResults = cacheKey ? lookupCache.get(cacheKey) : undefined;
  const results =
    cachedResults ??
    (lookupState?.cacheKey === cacheKey ? lookupState.results : []);
  const open = focused && results.length > 0;

  useEffect(() => {
    if (!lookupMode || !lookupQuery || !cacheKey || cachedResults) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      void lookup({ data: { mode: lookupMode, query: lookupQuery } })
        .then((nextResults) => {
          if (cancelled) return;
          lookupCache.set(cacheKey, nextResults);
          setLookupState({ cacheKey, results: nextResults });
        })
        .catch(() => {
          if (cancelled) return;
          lookupCache.set(cacheKey, []);
          setLookupState({ cacheKey, results: [] });
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [cacheKey, cachedResults, lookup, lookupMode, lookupQuery]);

  return (
    <div className={cn("grid gap-2", wrapperClassName)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
          aria-invalid={Boolean(error)}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
        />
        {open && results.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            {results.map((result) => (
              <button
                key={result.ico}
                type="button"
                className="flex w-full items-start rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(result);
                  setFocused(false);
                }}
              >
                <div className="min-w-0 space-y-1 py-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate font-serif font-medium">
                      {result.name}
                    </span>
                    {!result.isActive ? (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        neaktivní
                      </span>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    IČO: {result.ico}
                    {result.dic ? ` · DIČ: ${result.dic}` : ""}
                  </div>
                  {result.fullAddress ? (
                    <div className="text-xs text-muted-foreground">
                      {result.fullAddress}
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

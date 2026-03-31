import { createFileRoute, Link } from "@tanstack/react-router";
import { evolu, useEvolu } from "~/evolu";
import * as Evolu from "@evolu/common";
import { useQuery } from "@evolu/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useState } from "react";
import { Plus, FileText, Building2 } from "lucide-react";

const allProjects = evolu.createQuery((db) =>
  db
    .selectFrom("project")
    .selectAll()
    .where("isDeleted", "is", null)
    .orderBy("createdAt", "desc"),
);

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [projectName, setProjectName] = useState("");
  const projects = useQuery(allProjects);

  const { insert } = useEvolu();

  const handleInsert = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) return;

    const name = Evolu.NonEmptyString100.from(trimmedName);
    if (!name.ok) return;

    insert("project", {
      name: name.value,
      companyName: name.value,
      vatMode: "standard",
      isVatPayer: Evolu.sqliteFalse,
      defaultCurrency: "CZK" as Evolu.CurrencyCode,
    });

    setProjectName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleInsert();
  };

  const vatModeLabel = (mode: string | null) => {
    switch (mode) {
      case "standard":
        return "Standardní DPH";
      case "reverse-charge":
        return "Přenesená daňová povinnost";
      case "none":
        return "Bez DPH";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-baseline gap-4">
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              Fakturace
            </h1>
            <Separator orientation="vertical" className="h-6 self-center" />
            <p className="text-sm text-muted-foreground font-serif italic">
              správa projektů a faktur
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* New Project Input */}
        <section className="mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Nový projekt
          </h2>
          <div className="flex gap-3 max-w-lg">
            <Input
              placeholder="Název projektu..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-serif"
            />
            <Button onClick={handleInsert} className="gap-2 shrink-0">
              <Plus className="size-4" />
              Přidat
            </Button>
          </div>
        </section>

        <Separator className="mb-10" />

        {/* Projects Grid */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            Projekty ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Building2 className="size-8 text-muted-foreground" />
              </div>
              <p className="font-serif text-lg text-muted-foreground mb-1">
                Zatím žádné projekty
              </p>
              <p className="text-sm text-muted-foreground/70">
                Vytvořte svůj první projekt a začněte fakturovat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to="/$projectName"
                  params={{ projectName: project.name ?? "" }}
                  className="group block"
                >
                  <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30 group-hover:-translate-y-0.5">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-serif text-lg">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <Building2 className="size-3" />
                        {project.companyName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-muted-foreground">
                          {project.defaultCurrency}
                        </span>
                        <span className="text-muted-foreground">
                          {vatModeLabel(project.vatMode)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-primary/80">
                        <FileText className="size-3" />
                        <span className="font-serif italic">
                          Zobrazit faktury
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

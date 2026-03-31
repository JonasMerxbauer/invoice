import { createFileRoute } from "@tanstack/react-router";
import { evolu, useEvolu } from "~/evolu";
import * as Evolu from "@evolu/common";
import { useQuery } from "@evolu/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useState } from "react";

const allProjects = evolu.createQuery((db) =>
  db.selectFrom("project").selectAll().orderBy("name", "asc"),
);

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [projectName, setProjectName] = useState("");
  const projects = useQuery(allProjects);

  const { insert } = useEvolu();

  const handleInsert = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) return;

    insert("project", {
      name: trimmedName,
      companyName: trimmedName,
      vatMode: "standard",
      isVatPayer: Evolu.sqliteFalse,
      defaultCurrency: "CZK",
    });

    setProjectName("");
  };

  return (
    <div className="min-h-screen flex flex-col gap-2 justify-center items-center">
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex gap-2">
          <Input
            placeholder="New project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <Button onClick={handleInsert}>Add Project</Button>
        </div>
        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No projects yet. Create one to start invoicing.
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <div className="font-medium">{project.name}</div>
                <div className="text-muted-foreground">
                  {project.defaultCurrency} - {project.vatMode}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

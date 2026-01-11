import { createFileRoute } from "@tanstack/react-router";
import { evolu, useEvolu } from "~/evolu";
import * as Evolu from "@evolu/common";
import { useQuery } from "@evolu/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useState } from "react";

const allTodos = evolu.createQuery((db) => db.selectFrom("todo").selectAll());

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [title, setTitle] = useState("");
  const todos = useQuery(allTodos);

  const { insert } = useEvolu();

  const handleInsert = () => {
    insert("todo", {
      title: title,
      isCompleted: Evolu.sqliteFalse,
    });
  };
  return (
    <div className="min-h-screen flex flex-col gap-2 justify-center items-center">
      <div className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={handleInsert}>Add Todo</Button>
      </div>
      {todos.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}

import type { ReactElement } from "react";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export type TodoProps = {
  children: [ReactElement, ReactElement, ReactElement];
};

export type FilterStatus = "All" | "Active" | "Completed";


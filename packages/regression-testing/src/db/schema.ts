import type { Generated } from "kysely";

export type TodosTable = {
  id: Generated<number>;
  title: string;
  completed: number;
  created_at: string;
};

export type UsersTable = {
  id: Generated<number>;
  name: string;
  email: string;
  created_at: string;
};

export type DB = {
  todos: TodosTable;
  users: UsersTable;
};

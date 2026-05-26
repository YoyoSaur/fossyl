// Global declarations for code sample type checking

declare class AuthenticationError extends Error {
  constructor(message?: string);
}

declare function verifyJwt(token: string): { sub: string; role: string };
declare function getLogger(): { info: (msg: string, meta?: any) => void; warn: (msg: string, meta?: any) => void; error: (msg: string, meta?: any) => void };
declare function migrateToLatest(): Promise<void>;

declare const db: import('kysely').Kysely<any>;
declare function myAuth(headers: Record<string, string>): Promise<import('@fossyl/core').Authentication & { userId: string; role: string }>;
declare const routes: import('@fossyl/core').Route[];
declare const migrations: Record<string, unknown>;
declare const pino: { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void };

declare class MyValidationError extends Error {
  fieldErrors: Record<string, string>;
}

declare function searchDatabase(q: string, limit?: number, offset?: number): Promise<any>;
declare function searchDb(query: { q: string; limit: number; offset: number }): Promise<any>;

// Blog code sample types
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

type ResponseObject<T> =
  | { data: T; error?: never }
  | { data?: never; error: Error };

declare function ResponseWrap<T>(data: T): ResponseObject<T>;
declare function ErrorWrap(error: Error): ResponseObject<never>;

type UserPayload = { id: number; name: string };
type TodoPayload = { id: number; title: string; completed: boolean };

declare function getUser(id: number): Promise<ResponseObject<UserPayload>>;
declare function getTodos(userId: number): Promise<ResponseObject<TodoPayload[]>>;
declare function getReminders(userId: number): Promise<ResponseObject<TodoPayload[]>>;

type FullUser = {
  id: number;
  name: string;
  todos: TodoPayload[];
  reminders: TodoPayload[];
}

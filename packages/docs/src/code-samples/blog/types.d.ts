type FullUser = { id: number; name: string; todos: Todo[]; reminders: Reminder[] };
type Todo = { id: number; title: string; completed: boolean };
type Reminder = { id: number; text: string };

declare function getUser(id: number): Promise<ResponseObject<{ id: number; name: string }>>;
declare function getTodos(id: number): Promise<ResponseObject<Todo[]>>;
declare function getReminders(id: number): Promise<ResponseObject<Reminder[]>>;

// VIOLATION: no-repo-import-outside-service
// Non-service files must NOT import .repo files.
// Expected error: "Repository files (*.repo) can only be imported in service files (*.service)."

import { Todo } from '../features/todos/repo/todos.repo';
import { User } from '../features/users/repo/users.repo';

export interface Report {
  todo: Todo;
  user: User;
}

export function generateReport(todo: Todo, user: User): Report {
  return { todo, user };
}

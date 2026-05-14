// VIOLATION: no-repo-import-outside-service
// Service files should only import repositories with matching names.
// This file is 'things.service.ts' but imports 'todos.repo' (different boundary).
// Expected error: "Service file imports repository from a different service boundary..."

import { findAll } from '../features/todos/repo/todos.repo';

export async function getAllThings() {
  return findAll(10, 1, {});
}

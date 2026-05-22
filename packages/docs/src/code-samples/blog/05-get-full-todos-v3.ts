// @code-block-start: get-full-todos-v3
async function getFullTodos(userId: number): Promise<Todo[]> {
  const user = await getUser(userId);
  const todos = await getTodos(user.id);
  const reminders = await getReminders(user.id);

  return {
    ...user,
    todos,
    reminders,
  };
}
// @code-block-end: get-full-todos-v3

// @code-block-start: get-full-todos-v3
async function _getFullTodos(userId: number): Promise<FullUser> {
  const { data: user } = await getUser(userId);
  if (!user) throw new Error("User not found");
  const { data: todos } = await getTodos(user.id);
  const { data: reminders } = await getReminders(user.id);

  return {
    ...user,
    todos: todos ?? [],
    reminders: reminders ?? [],
  };
}
// @code-block-end: get-full-todos-v3

// @code-block-start: get-full-todos-v2
async function getFullTodos(userId: number): Promise<ResponseObject<FullUser>> {
  const { data: user, error: userError } = await getUser(userId);
  if (userError) return ErrorWrap(userError);
  const { data: todos, error: todosError } = await getTodos(user.id);
  if (todosError) return ErrorWrap(todosError);
  const { data: reminders, error: remindersError } = await getReminders(user.id);
  if (remindersError) return ErrorWrap(remindersError);

  return ResponseWrap({
    ...user,
    todos,
    reminders,
  });
}
// @code-block-end: get-full-todos-v2
export {};

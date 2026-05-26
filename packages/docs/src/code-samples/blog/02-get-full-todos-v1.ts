// @code-block-start: get-full-todos-v1
async function getFullTodos(userId: number): Promise<ResponseObject<FullUser>> {
  const userResponse = await getUser(userId);
  if (!userResponse.data) return userResponse;
  const todosResponse = await getTodos(userResponse.data.id);
  if (!todosResponse.data) return todosResponse;
  const reminderResponse = await getReminders(userResponse.data.id);
  if (!reminderResponse.data) return reminderResponse;

  return ResponseWrap({
    ...userResponse.data,
    todos: todosResponse.data,
    reminders: reminderResponse.data,
  });
}
// @code-block-end: get-full-todos-v1
export {};

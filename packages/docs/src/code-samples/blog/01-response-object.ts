// @code-block-start: response-object
export type ResponseObject<T> = { data?: T; error?: Error };
export function ResponseWrap<T>(data: T): ResponseObject<T> {
  return { data };
}
export function ErrorWrap(error: Error): ResponseObject<never> {
  return { error };
}
// @code-block-end: response-object

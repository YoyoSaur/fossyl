// @code-block-start: response-object-discriminated
export type ResponseObject<T> = { data: T; error?: never } | { data?: never; error: Error };
// @code-block-end: response-object-discriminated

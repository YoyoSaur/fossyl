const fossylErrorMap = {
  400: { httpStatus: 400, code: "BAD_REQUEST", defaultMessage: "Bad Request" },
  401: { httpStatus: 401, code: "UNAUTHORIZED", defaultMessage: "Unauthorized" },
  403: { httpStatus: 403, code: "FORBIDDEN", defaultMessage: "Forbidden" },
  404: { httpStatus: 404, code: "NOT_FOUND", defaultMessage: "Not Found" },
  409: { httpStatus: 409, code: "CONFLICT", defaultMessage: "Conflict" },
  422: { httpStatus: 422, code: "VALIDATION_ERROR", defaultMessage: "Validation failed" },
  500: { httpStatus: 500, code: "INTERNAL_ERROR", defaultMessage: "Internal server error" },
} as const;

export type FossylStatusCode = keyof typeof fossylErrorMap;

export type FossylError<Code extends FossylStatusCode = FossylStatusCode> = {
  readonly __fossyl: true;
  readonly httpStatus: Code;
  readonly code: (typeof fossylErrorMap)[Code]["code"];
  readonly message: string;
  readonly details?: unknown;
};

function fossylError<Code extends FossylStatusCode>(
  status: Code,
  message?: string,
  details?: unknown
): FossylError<Code> {
  return {
    __fossyl: true,
    httpStatus: status,
    code: fossylErrorMap[status].code,
    message: message ?? fossylErrorMap[status].defaultMessage,
    details,
  };
}

export function fossylBad(message?: string, details?: unknown): FossylError<400> {
  return fossylError(400, message, details);
}

export function fossylUnauthorized(message?: string, details?: unknown): FossylError<401> {
  return fossylError(401, message, details);
}

export function fossylForbidden(message?: string, details?: unknown): FossylError<403> {
  return fossylError(403, message, details);
}

export function fossylNotFound(message?: string, details?: unknown): FossylError<404> {
  return fossylError(404, message, details);
}

export function fossylConflict(message?: string, details?: unknown): FossylError<409> {
  return fossylError(409, message, details);
}

export function fossylValidationError(message?: string, details?: unknown): FossylError<422> {
  return fossylError(422, message, details);
}

export function fossylInternal(message?: string, details?: unknown): FossylError<500> {
  return fossylError(500, message, details);
}

export function isFossylError(error: unknown): error is FossylError {
  return !!error && typeof error === "object" && "__fossyl" in error;
}

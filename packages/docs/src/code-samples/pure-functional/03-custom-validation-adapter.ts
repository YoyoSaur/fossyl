// @code-block-start: custom-validation-adapter
// Validation adapters format errors for HTTP responses.
// They are standalone modules — no framework coupling.
import type { ValidationAdapter } from 'fossyl';

const myValidationAdapter: ValidationAdapter = {
  type: 'validation',
  name: 'my-validator',

  formatError: (error: unknown) => {
    if (error instanceof MyValidationError) {
      return {
        message: 'Validation failed',
        details: error.fieldErrors,
      };
    }
    return { message: 'Validation failed' };
  },
};
// @code-block-end: custom-validation-adapter

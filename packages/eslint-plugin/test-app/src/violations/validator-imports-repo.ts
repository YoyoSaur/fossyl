// VIOLATION: no-repo-import-outside-service
// Validator files must NOT import .repo files directly.
// Expected error: "Repository files (*.repo) can only be imported in service files (*.service)."

import * as userRepo from '../features/users/repo/users.repo';
import { z } from 'zod';

// This is wrong - validators should not access repos
export const badValidator = z.object({
  email: z.string().email(),
});

// Using repo in a validator bypasses the service layer
export async function checkEmailExists(email: string): Promise<boolean> {
  const user = await userRepo.findByEmail(email);
  return user !== undefined;
}

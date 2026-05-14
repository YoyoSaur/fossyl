import * as userRepo from '../repo/users.repo';

export type { User } from '../repo/users.repo';

export async function getUser(id: string): Promise<userRepo.User> {
  const user = await userRepo.findById(id);
  if (!user) throw new Error('User not found');
  return user;
}

export async function createUser(
  name: string,
  email: string,
): Promise<userRepo.User> {
  return userRepo.create({ name, email });
}

export async function updateUser(
  id: string,
  data: { name?: string },
): Promise<userRepo.User> {
  return userRepo.update(id, data);
}

export async function deleteUser(id: string): Promise<void> {
  await userRepo.remove(id);
}

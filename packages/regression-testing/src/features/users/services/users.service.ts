import * as userRepo from "../../../db/repos/users.repo";

export async function getUser(id: number) {
  return userRepo.getUser(id);
}

export async function createUser(name: string, email: string) {
  return userRepo.createUser(name, email);
}

export async function updateUser(id: number, data: { name?: string; email?: string }) {
  return userRepo.updateUser(id, data);
}

export async function deleteUser(id: number) {
  return userRepo.deleteUser(id);
}

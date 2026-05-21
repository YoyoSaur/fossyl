import { authWrapper } from "@fossyl/core";
import { AuthenticationError } from "@fossyl/express";

export const authenticator = async (headers: Record<string, string>) => {
  const userId = headers["x-user-id"];
  if (!userId) {
    throw new AuthenticationError("Unauthorized");
  }
  return authWrapper({ userId });
};

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { getNativeSession } from "./native-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const nativeSession = await getNativeSession(opts.req);
    if (nativeSession) {
      const nativeUser = await getUserById(nativeSession.userId);
      const lastSignedIn = nativeUser?.lastSignedIn?.getTime() ?? 0;
      const issuedAt = nativeSession.issuedAt * 1000;
      if (nativeUser && issuedAt >= lastSignedIn) user = nativeUser;
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

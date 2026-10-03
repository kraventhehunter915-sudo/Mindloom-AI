import { createContext, useContext } from "react";

type AccountScopeValue = { scope: string };

const AccountScopeContext = createContext<AccountScopeValue>({ scope: "local" });

export function AccountScopeProvider({ scope, children }: { scope: string; children: React.ReactNode }) {
  return <AccountScopeContext.Provider value={{ scope }}>{children}</AccountScopeContext.Provider>;
}

export function useAccountScope() {
  return useContext(AccountScopeContext);
}

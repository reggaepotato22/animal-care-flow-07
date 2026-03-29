import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
import { getAccounts, getActiveAccountId, setActiveAccountId, getActiveAccount, type Account } from "@/lib/accountStore";

export interface AccountContextValue {
  accounts: Account[];
  activeAccount: Account | null;
  activeAccountId: string;
  setActiveAccount: (accountId: string) => void;
  refreshAccounts: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const activeAccountId = useMemo(() => getActiveAccountId(), [tick]);
  const accounts = useMemo(() => getAccounts(), [tick]);
  const activeAccount = useMemo(() => getActiveAccount(), [tick]);

  const refreshAccounts = useCallback(() => setTick(t => t + 1), []);

  const setActiveAccount = useCallback((accountId: string) => {
    setActiveAccountId(accountId);
    setTick(t => t + 1);
  }, []);

  useEffect(() => {
    if (!activeAccountId) {
      setActiveAccountId("acct-demo");
      setTick(t => t + 1);
    }
  }, [activeAccountId]);

  const value: AccountContextValue = {
    accounts,
    activeAccount,
    activeAccountId,
    setActiveAccount,
    refreshAccounts,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}

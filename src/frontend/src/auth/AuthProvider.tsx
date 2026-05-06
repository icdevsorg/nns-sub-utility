import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import type { Identity } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { CONFIG } from '../config';

export type AuthMethod = 'ii' | 'plug' | null;

interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
  authMethod: AuthMethod;
  isLoading: boolean;
  login: () => Promise<void>;
  loginPlug: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const PLUG_WHITELIST = [CONFIG.SUBS_CANISTER_ID];

const TEST_IDENTITY_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_IDENTITY === 'true';

/**
 * Check for a test identity injected via window.__TEST_IDENTITY__.
 * Only active in development or when explicitly enabled for E2E builds.
 */
function getTestIdentity(): Ed25519KeyIdentity | null {
  if (!TEST_IDENTITY_ENABLED) return null;
  try {
    const raw = (window as any).__TEST_IDENTITY__;
    if (raw) {
      return Ed25519KeyIdentity.fromJSON(raw);
    }
  } catch {
    // Ignore — not in test mode
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);

  useEffect(() => {
    // Check for test identity first
    const testId = getTestIdentity();
    if (testId) {
      setIdentity(testId);
      setIsAuthenticated(true);
      setAuthMethod('ii');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      const client = await AuthClient.create();
      if (cancelled) return;
      setAuthClient(client);

      const authenticated = await client.isAuthenticated();
      if (authenticated) {
        const id = client.getIdentity();
        setIdentity(id);
        setIsAuthenticated(true);
        setAuthMethod('ii');
        setIsLoading(false);
        return;
      }

      // Check for existing Plug session
      try {
        if ((window as any).ic?.plug) {
          const plugConnected = await (window as any).ic.plug.isConnected();
          if (plugConnected) {
            setIsAuthenticated(true);
            setAuthMethod('plug');
          }
        }
      } catch {
        // Plug not available
      }

      if (!cancelled) setIsLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async () => {
    if (!authClient) return;
    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: CONFIG.II_URL,
        onSuccess: () => {
          const id = authClient.getIdentity();
          setIdentity(id);
          setIsAuthenticated(true);
          setAuthMethod('ii');
          resolve();
        },
        onError: (err) => reject(new Error(err)),
      });
    });
  }, [authClient]);

  const loginPlug = useCallback(async () => {
    const ic = (window as any).ic;
    if (!ic?.plug) {
      window.open('https://plugwallet.ooo/', '_blank');
      return;
    }

    const connected = await ic.plug.isConnected();
    if (!connected) {
      await ic.plug.requestConnect({
        whitelist: PLUG_WHITELIST,
        host: CONFIG.IC_HOST,
      });
    }

    setIsAuthenticated(true);
    setAuthMethod('plug');
    setIdentity(null);
  }, []);

  const logout = useCallback(async () => {
    if (authMethod === 'ii' && authClient) {
      await authClient.logout();
    } else if (authMethod === 'plug') {
      try { await (window as any).ic?.plug?.disconnect(); } catch { /* ignore */ }
    }
    setIdentity(null);
    setIsAuthenticated(false);
    setAuthMethod(null);
  }, [authMethod, authClient]);

  const principal = (() => {
    if (identity) return identity.getPrincipal().toText();
    if (authMethod === 'plug' && isAuthenticated) {
      // Principal is fetched asynchronously for Plug — we'll show it once available
      return null;
    }
    return null;
  })();

  return (
    <AuthContext.Provider value={{ isAuthenticated, identity, principal, authMethod, isLoading, login, loginPlug, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

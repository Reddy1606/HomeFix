import { useCallback, useEffect, useRef, useState } from 'react';
import { getProfile, loginAccount, registerAccount } from '../api/auth';
import { apiError } from '../utils/validation';

import { AuthContext } from './auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const generation = useRef(0);

  const logout = useCallback(() => {
    generation.current += 1;
    localStorage.removeItem('token');
    setUser(null);
    setSessionError('');
    setLoading(false);
  }, []);

  const restoreSession = useCallback(async () => {
    const current = ++generation.current;
    setSessionError('');
    if (!localStorage.getItem('token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profile = await getProfile();
      if (current === generation.current) setUser(profile);
    } catch (error) {
      if (current !== generation.current) return;
      if ([401, 403].includes(error.response?.status)) logout();
      else {
        setUser(null);
        setSessionError(apiError(error));
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Đồng bộ phiên với token lưu ngoài React và API /auth/me.
    // oxlint-disable-next-line react/set-state-in-effect
    restoreSession();
    const onExpired = () => logout();
    const onStorage = (event) => {
      if (event.key === 'token' || event.key === null) restoreSession();
    };
    window.addEventListener('homefix:session-expired', onExpired);
    window.addEventListener('storage', onStorage);
    return () => {
      generation.current += 1;
      window.removeEventListener('homefix:session-expired', onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, [logout, restoreSession]);

  const authenticate = async (action, payload) => {
    const result = await action(payload);
    if (!result?.token || !result?.user)
      throw new Error('Invalid authentication response');
    generation.current += 1;
    localStorage.setItem('token', result.token);
    setUser(result.user);
    setSessionError('');
    setLoading(false);
    return result.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        restoreSession,
        logout,
        setUser,
        login: (payload) => authenticate(loginAccount, payload),
        register: (payload) => authenticate(registerAccount, payload),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

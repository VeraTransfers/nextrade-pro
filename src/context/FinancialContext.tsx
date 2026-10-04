import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { AppState, TransactionType, User } from '../types';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { INITIAL_STATE } from '../utils/initialState';
import { getAsset } from '../utils/marketData';
import { supabase } from '../lib/supabase';

interface FinancialContextType {
  state: AppState;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  resetState: () => void;
  registerUser: (data: Omit<User, 'id' | 'role'>) => void;
  
  isInitializing: boolean;
  remoteProfile: any | null;
  remoteAccount: any | null;

  // User Actions
  buyAsset: (userId: string, assetId: string, quantity: number, price: number) => Promise<void>;
  sellAsset: (userId: string, assetId: string, quantity: number, price: number) => Promise<void>;
  requestWithdrawal: (userId: string, amount: number) => Promise<void>;
  // Admin Actions
  addCapital: (userId: string, amount: number) => Promise<void>;
  adjustAccount: (userId: string, type: 'PROFIT' | 'LOSS', amount: number, concept: string) => Promise<void>;
  toggleWithdrawalBlock: (userId: string, block: boolean) => void;
  updateWithdrawalStatus: (withdrawalId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useLocalStorageState<AppState>('nextrade_pro_v2_state', INITIAL_STATE);
  const [currentUser, setCurrentUser] = useLocalStorageState<User | null>('nextrade_pro_v2_user', null);

  const [session, setSession] = useState<any>(null);
  const [remoteProfile, setRemoteProfile] = useState<any>(null);
  const [remoteAccount, setRemoteAccount] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setRemoteProfile(null);
        setRemoteAccount(null);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileAndAccount = async (uid: string, retries = 5) => {
      setIsInitializing(true);
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();
        const { data: account } = await supabase.from('accounts').select('*').eq('user_id', uid).single();

        if (profile && account && isMounted) {
          setRemoteProfile(profile);
          setRemoteAccount(account);
          
          // Compatibilidad Legacy: inyectamos el perfil remoto en el estado local de currentUser
          setCurrentUser({
            id: profile.id,
            name: profile.full_name,
            username: profile.username,
            email: session?.user?.email || '',
            role: profile.role,
            password: '***'
          });
          
          await refreshFinancialData(uid); // Asegurar que el estado legacy reciba la info real
          
          setIsInitializing(false);
        } else if (retries > 0 && isMounted) {
          setTimeout(() => fetchProfileAndAccount(uid, retries - 1), 1000);
        } else if (isMounted) {
          console.error("No se pudo cargar la cuenta de Supabase tras múltiples reintentos.");
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Error al cargar datos del usuario desde Supabase:", err);
        if (retries > 0 && isMounted) {
          setTimeout(() => fetchProfileAndAccount(uid, retries - 1), 1000);
        } else if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    if (session?.user?.id) {
      fetchProfileAndAccount(session.user.id);
    } else {
      setIsInitializing(false);
    }

    return () => { isMounted = false; };
  }, [session]);

  const refreshFinancialData = async (uid: string) => {
    try {
      const { data: account } = await supabase.from('accounts').select('*').eq('user_id', uid).single();
      const { data: portfolio } = await supabase.from('portfolio_positions').select('*').eq('account_id', account?.id);
      const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false });

      if (account) {
        setRemoteAccount(account);
        
        // Sincronizar localStorage con la verdad del backend para no romper los componentes que aún leen de 'state'
        setState(prev => {
          // Convertir portfolio de backend al formato legacy esperado
          const mappedPortfolio = (portfolio || []).map(p => ({
            assetId: p.symbol,
            quantity: p.quantity,
            entryPrice: p.average_price,
            investedAmount: p.invested_amount
          }));

          // Convertir transacciones de backend al formato legacy esperado
          const mappedTxs = (txs || []).map(t => ({
            id: t.id,
            date: t.created_at,
            userId: t.user_id,
            type: t.type,
            concept: t.metadata?.concept || `Operación: ${t.type}`,
            amount: t.amount,
            previousBalance: t.balance_before,
            newBalance: t.balance_after,
            assetId: t.symbol,
            quantity: t.quantity,
            price: t.price
          }));

          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              [uid]: {
                ...prev.accounts[uid],
                balance: account.balance,
                capital: account.capital,
                invested: account.invested,
                profit: account.profit,
                loss: account.loss,
                blockWithdrawals: account.block_withdrawals
              }
            },
            portfolios: {
              ...prev.portfolios,
              [uid]: mappedPortfolio
            },
            transactions: mappedTxs
          };
        });
      }
    } catch (err) {
      console.error("Error refrescando datos financieros:", err);
    }
  };

  const logTransaction = (
    userId: string, 
    type: TransactionType, 
    concept: string, 
    amount: number, 
    prevBal: number, 
    newBal: number,
    assetId?: string,
    quantity?: number,
    price?: number
  ) => {
    const tx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      userId, type, concept, amount, previousBalance: prevBal, newBalance: newBal, assetId, quantity, price
    };
    return tx;
  };

  const buyAsset = async (userId: string, assetId: string, quantity: number, price: number) => {
    if (currentUser?.id !== userId && currentUser?.role !== 'ADMIN') throw new Error('No autorizado');
    const asset = getAsset(assetId);
    if (!asset || quantity <= 0) throw new Error('Activo inválido o cantidad <= 0');
    if (price <= 0 || isNaN(price)) throw new Error('Precio inválido');
    
    const { data, error } = await supabase.rpc('execute_buy', {
      p_symbol: asset.symbol,
      p_asset_type: asset.category,
      p_quantity: quantity,
      p_price: price
    });

    if (error) {
      throw new Error(error.message);
    }

    // Refrescar datos desde la fuente de verdad
    await refreshFinancialData(userId);
  };

  const sellAsset = async (userId: string, assetId: string, quantity: number, price: number) => {
    if (currentUser?.id !== userId && currentUser?.role !== 'ADMIN') throw new Error('No autorizado');
    const asset = getAsset(assetId);
    if (!asset || quantity <= 0) throw new Error('Activo inválido o cantidad <= 0');
    if (price <= 0 || isNaN(price)) throw new Error('Precio inválido');
    
    const { data, error } = await supabase.rpc('execute_sell', {
      p_symbol: asset.symbol,
      p_quantity: quantity,
      p_price: price
    });

    if (error) {
      throw new Error(error.message);
    }

    // Refrescar datos desde la fuente de verdad
    await refreshFinancialData(userId);
  };

  const requestWithdrawal = async (userId: string, amount: number) => {
    if (currentUser?.id !== userId && currentUser?.role !== 'ADMIN') throw new Error('No autorizado');
    
    if (amount <= 0) throw new Error('Monto inválido');

    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_amount: amount
    });

    if (error) {
      throw new Error(error.message);
    }

    // Refrescar datos desde la fuente de verdad
    await refreshFinancialData(userId);
  };

  const addCapital = async (userId: string, amount: number) => {
    if (currentUser?.role !== 'ADMIN') throw new Error('No autorizado');
    if (amount <= 0) throw new Error('Monto inválido');
    
    const { error } = await supabase.rpc('admin_credit_funds', {
      p_target_user_id: userId,
      p_amount: amount
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const adjustAccount = async (userId: string, type: 'PROFIT' | 'LOSS', amount: number, concept: string) => {
    if (currentUser?.role !== 'ADMIN') throw new Error('No autorizado');
    if (amount <= 0) throw new Error('Monto inválido');
    if (!concept || concept.trim() === '') throw new Error('El concepto es obligatorio');

    const { error } = await supabase.rpc('admin_register_result', {
      p_target_user_id: userId,
      p_type: type,
      p_amount: amount,
      p_concept: concept.trim()
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const toggleWithdrawalBlock = (userId: string, block: boolean) => {
    if (currentUser?.role !== 'ADMIN') return;
    setState(prev => {
      const acc = prev.accounts[userId];
      if (!acc) return prev;
      return {
        ...prev,
        accounts: { ...prev.accounts, [userId]: { ...acc, blockWithdrawals: block } }
      };
    });
  };

  const updateWithdrawalStatus = async (withdrawalId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (currentUser?.role !== 'ADMIN') throw new Error('No autorizado');

    let error;
    if (status === 'APPROVED') {
      const res = await supabase.rpc('approve_withdrawal', {
        p_withdrawal_id: withdrawalId
      });
      error = res.error;
    } else {
      const res = await supabase.rpc('reject_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_reason: reason || 'Rechazado por el administrador'
      });
      error = res.error;
    }

    if (error) {
      throw new Error(error.message);
    }
  };

  const resetState = () => {
    setState(INITIAL_STATE);
  };

  const registerUser = (data: Omit<User, 'id' | 'role'>) => {
    // Disabled locally, handled entirely by Supabase Auth and triggers
  };

  return (
    <FinancialContext.Provider value={{
      state, currentUser, setCurrentUser, resetState, registerUser,
      isInitializing, remoteProfile, remoteAccount,
      buyAsset, sellAsset, requestWithdrawal,
      addCapital, adjustAccount, toggleWithdrawalBlock, updateWithdrawalStatus
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error("useFinancial must be used within FinancialProvider");
  return ctx;
};

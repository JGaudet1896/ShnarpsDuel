import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  date: number;
  type: 'win' | 'loss' | 'reset';
  amount: number;
  balance: number;
  description: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  
  // Actions
  addTransaction: (type: 'win' | 'loss' | 'reset', amount: number, description: string) => void;
  resetWallet: () => void;
  setBalance: (balance: number) => void;
}

const DEFAULT_WALLET_BALANCE = 100;

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: DEFAULT_WALLET_BALANCE,
      transactions: [],
      
      addTransaction: (type: 'win' | 'loss' | 'reset', amount: number, description: string) => {
        const state = get();
        const newBalance = type === 'reset' 
          ? amount 
          : type === 'win' 
            ? state.balance + amount 
            : state.balance - amount;
        
        const transaction: Transaction = {
          id: `tx_${Date.now()}_${Math.random()}`,
          date: Date.now(),
          type,
          amount,
          balance: newBalance,
          description
        };
        
        set({
          balance: newBalance,
          transactions: [transaction, ...state.transactions]
        });
      },
      
      resetWallet: () => {
        set({
          balance: DEFAULT_WALLET_BALANCE,
          transactions: []
        });
      },
      
      setBalance: (balance: number) => {
        set({ balance });
      }
    }),
    {
      name: 'shnarps-wallet'
    }
  )
);

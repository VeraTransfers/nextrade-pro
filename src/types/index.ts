export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  role: UserRole;
  username: string;
  name: string;
  email: string;
  password?: string;
}

export interface Account {
  id: string;
  userId: string;
  balance: number;       // Saldo disponible
  capital: number;       // Capital aportado
  invested: number;      // Capital invertido en posiciones
  profit: number;        // Ganancias cerradas o ajustadas
  loss: number;          // Pérdidas cerradas o ajustadas
  blockWithdrawals: boolean;
  status: 'ACTIVE' | 'BLOCKED';
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: 'STOCKS' | 'CRYPTO' | 'GOLD' | 'OIL' | 'COFFEE';
  currentPrice: number;
  change24h: number;
}

export interface Position {
  assetId: string;
  quantity: number;
  entryPrice: number;
  investedAmount: number;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL' | 'ADJUSTMENT' | 'PROFIT' | 'LOSS';

export interface Transaction {
  id: string;
  date: string;
  userId: string;
  type: TransactionType;
  concept: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  assetId?: string;
  quantity?: number;
  price?: number;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

export interface Withdrawal {
  id: string;
  date: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
}

export interface ChartDataPoint {
  day: string;
  value: number;
}

export interface AppState {
  users: User[];
  accounts: Record<string, Account>;
  portfolios: Record<string, Position[]>;
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  chartData: Record<string, ChartDataPoint[]>;
}

export type TransactionType = "income" | "expense";
export type WalletType = "online" | "cash" | "savings";
export type TimeFilter = "month" | "all";

export interface WalletItem {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  color: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  walletId: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  rawDate: number;
}

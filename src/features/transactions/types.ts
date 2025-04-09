export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TransactionType = 'BUY' | 'SELL' | 'SEND' | 'RECEIVE' | 'WITHDRAW';

export interface Transaction {
  _id: string;
  userId: string;
  mainAccountName?: string;
  type: TransactionType;
  amount: string;
  status: TransactionStatus;
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  receipt?: string;
  customerDetails?: {
    name: string;
    phone: string;
    location: string;
  };
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
} 
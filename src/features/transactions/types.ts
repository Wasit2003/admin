export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;  // MongoDB ID
  clientUuid?: string;  // Optional client UUID
  userId: string;
  userPhone: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: string;
  exchangeRate: number;
  sypAmount: number;
  receiptUrl?: string;
  rejectionReason?: string;
  transactionHash?: string;
} 
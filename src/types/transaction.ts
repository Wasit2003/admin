export interface Transaction {
  _id: string;
  userId: string;
  mainAccountName: string;
  type: 'BUY' | 'SELL' | 'SEND' | 'RECEIVE' | 'WITHDRAW';
  amount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  customerDetails: {
    name: string;
    phone: string;
    location: string;
  };
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  success: boolean;
  transactions: Transaction[];
} 
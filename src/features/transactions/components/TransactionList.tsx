import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Transaction } from '../types';
import { formatDate } from '../../../utils/date';
import { formatAmount } from '../../../utils/currency';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onTransactionClick,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>IDs</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              onClick={() => onTransactionClick(transaction)}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
            >
              <TableCell>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>MongoDB: {transaction.id}</span>
                    <Tooltip title="Copy MongoDB ID">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(transaction.id);
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                  {transaction.clientUuid && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Client: {transaction.clientUuid}</span>
                      <Tooltip title="Copy Client UUID">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(transaction.clientUuid);
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  label={transaction.type}
                  color={transaction.type === 'BUY' ? 'primary' : 'secondary'}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatAmount(transaction.amount)}</TableCell>
              <TableCell>
                <Chip
                  label={transaction.status}
                  color={
                    transaction.status === 'APPROVED'
                      ? 'success'
                      : transaction.status === 'REJECTED'
                      ? 'error'
                      : 'warning'
                  }
                  size="small"
                />
              </TableCell>
              <TableCell>{formatDate(transaction.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 
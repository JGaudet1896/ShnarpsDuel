import { useWallet, Transaction } from '@/lib/stores/useWallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wallet, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

interface TransactionHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function TransactionHistory({ open, onClose }: TransactionHistoryProps) {
  const { transactions, balance, resetWallet } = useWallet();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your wallet? This will clear all transaction history and reset your balance to the starting amount.')) {
      resetWallet();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Transaction History (Play Money)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Current Balance (Not Real Money)</span>
              <span className="text-2xl font-bold text-green-700">🪙 {balance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-green-600 mt-2 text-center">
              Your first 100 coins are on the house! 🎉
            </p>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Wallet
              </Button>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border bg-white p-2">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Wallet className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No transactions yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Your wins and losses will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx: Transaction) => (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-lg border ${
                        tx.type === 'win'
                          ? 'bg-green-50 border-green-200'
                          : tx.type === 'loss'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {tx.type === 'win' ? (
                            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : tx.type === 'loss' ? (
                            <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                          ) : (
                            <RotateCcw className="h-5 w-5 text-gray-600 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{tx.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(tx.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              tx.type === 'win'
                                ? 'text-green-600'
                                : tx.type === 'loss'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {tx.type === 'win' ? '+' : tx.type === 'loss' ? '-' : ''}🪙
                            {tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Balance: 🪙 {tx.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight,
  Plus,
  Building2,
  Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Philippine banks that support Instapay
const INSTAPAY_BANKS = [
  { code: "BDO", name: "BDO Unibank" },
  { code: "BPI", name: "Bank of the Philippine Islands" },
  { code: "MBT", name: "Metrobank" },
  { code: "UBP", name: "UnionBank of the Philippines" },
  { code: "LBP", name: "Land Bank of the Philippines" },
];

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [transferType, setTransferType] = useState<"intrabank" | "interbank">("intrabank");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  // Instapay fields
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [recipientAccountName, setRecipientAccountName] = useState("");

  const utils = trpc.useUtils();
  const { data: transactions, isLoading } = trpc.transaction.list.useQuery();
  const { data: accounts } = trpc.account.list.useQuery();

  const deposit = trpc.transaction.deposit.useMutation({
    onSuccess: (tx) => {
      toast.success(`Deposit successful. Ref: ${tx?.referenceNumber}`);
      resetForm();
      utils.transaction.list.invalidate();
      utils.account.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const withdraw = trpc.transaction.withdraw.useMutation({
    onSuccess: (tx) => {
      toast.success(`Withdrawal successful. Ref: ${tx?.referenceNumber}`);
      resetForm();
      utils.transaction.list.invalidate();
      utils.account.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const transfer = trpc.transaction.internalTransfer.useMutation({
    onSuccess: (tx) => {
      toast.success(`Transfer successful. Ref: ${tx?.referenceNumber}`);
      resetForm();
      utils.transaction.list.invalidate();
      utils.account.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setIsTransactionOpen(false);
    setSelectedAccountId("");
    setToAccountNumber("");
    setAmount("");
    setDescription("");
    setTransferType("intrabank");
    setSelectedBank("");
    setRecipientAccountNumber("");
    setRecipientAccountName("");
  };

  const filteredTransactions = transactions?.filter(
    (tx) =>
      tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.accountNumber.includes(searchTerm) ||
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(Math.abs(num));
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "WITHDRAWAL":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case "INTERNAL_TRANSFER":
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      case "INSTAPAY":
        return <Zap className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Deposit</Badge>;
      case "WITHDRAWAL":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Withdrawal</Badge>;
      case "INTERNAL_TRANSFER":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Transfer</Badge>;
      case "INSTAPAY":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Instapay</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const handleTransaction = () => {
    if (!selectedAccountId || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const accountId = parseInt(selectedAccountId);
    const amountValue = parseFloat(amount);

    if (transactionType === "deposit") {
      deposit.mutate({ accountId, amount, description: description || undefined });
    } else if (transactionType === "withdraw") {
      withdraw.mutate({ accountId, amount, description: description || undefined });
    } else if (transactionType === "transfer") {
      if (transferType === "intrabank") {
        // Intrabank transfer (existing functionality)
        if (!toAccountNumber || toAccountNumber.length !== 10) {
          toast.error("Please enter a valid 10-digit destination account number");
          return;
        }
        transfer.mutate({
          fromAccountId: accountId,
          toAccountNumber,
          amount,
          description: description || undefined,
        });
      } else {
        // Interbank transfer (Instapay) - UI only simulation
        if (!selectedBank) {
          toast.error("Please select a destination bank");
          return;
        }
        if (!recipientAccountNumber) {
          toast.error("Please enter the recipient account number");
          return;
        }
        if (!recipientAccountName) {
          toast.error("Please enter the recipient account name");
          return;
        }
        if (amountValue > 50000) {
          toast.error("Instapay transfers are limited to ₱50,000 per transaction");
          return;
        }
        
        // Simulate Instapay transfer (UI only)
        const selectedBankInfo = INSTAPAY_BANKS.find(b => b.code === selectedBank);
        toast.success(
          `Instapay transfer of ${formatCurrency(amountValue)} to ${recipientAccountName} at ${selectedBankInfo?.name} has been processed successfully!`,
          { duration: 5000 }
        );
        resetForm();
      }
    }
  };

  const isPending = deposit.isPending || withdraw.isPending || transfer.isPending;

  const selectedAccount = accounts?.find((a) => a.id.toString() === selectedAccountId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Transactions</h1>
            <p className="text-muted-foreground">Process and view transactions</p>
          </div>
          <Button onClick={() => setIsTransactionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, account number, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions?.length || 0} transactions (showing last 100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTransactions && filteredTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">
                        {tx.referenceNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          {getTransactionBadge(tx.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {tx.accountNumber}
                      </TableCell>
                      <TableCell>{tx.customerName}</TableCell>
                      <TableCell
                        className={`font-medium ${
                          parseFloat(tx.amount) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {parseFloat(tx.amount) >= 0 ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(tx.balanceAfter)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions found</p>
                <p className="text-sm">Click "New Transaction" to process one</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription>
              Process a deposit, withdrawal, or transfer.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as typeof transactionType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deposit" className="flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3" />
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Withdraw
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Transfer
              </TabsTrigger>
            </TabsList>

            {/* Deposit and Withdraw Content */}
            {transactionType !== "transfer" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.filter(a => a.status === "active").map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountNumber} - {account.customerName} ({formatCurrency(account.balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAccount && (
                    <p className="text-xs text-muted-foreground">
                      Available balance: {formatCurrency(selectedAccount.balance)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Amount (PHP)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Transfer Content with Subtabs */}
            {transactionType === "transfer" && (
              <div className="py-4">
                {/* Transfer Type Subtabs */}
                <Tabs value={transferType} onValueChange={(v) => setTransferType(v as typeof transferType)}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="intrabank" className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Intrabank
                    </TabsTrigger>
                    <TabsTrigger value="interbank" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Interbank
                    </TabsTrigger>
                  </TabsList>

                  {/* Intrabank Transfer */}
                  <TabsContent value="intrabank" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label>From Account</Label>
                      <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.filter(a => a.status === "active").map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.accountNumber} - {account.customerName} ({formatCurrency(account.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAccount && (
                        <p className="text-xs text-muted-foreground">
                          Available balance: {formatCurrency(selectedAccount.balance)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>To Account Number</Label>
                      <Input
                        placeholder="Enter 10-digit Secbank account number"
                        value={toAccountNumber}
                        onChange={(e) => setToAccountNumber(e.target.value)}
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Transfer to another Secbank account
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (PHP)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        placeholder="Enter description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  {/* Interbank Transfer (Instapay) */}
                  <TabsContent value="interbank" className="space-y-4 mt-0">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-purple-800">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium text-sm">Instapay Transfer</span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        Instant transfer to other banks • Free of charge • Max ₱50,000
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>From Account</Label>
                      <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.filter(a => a.status === "active").map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.accountNumber} - {account.customerName} ({formatCurrency(account.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAccount && (
                        <p className="text-xs text-muted-foreground">
                          Available balance: {formatCurrency(selectedAccount.balance)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Destination Bank</Label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {INSTAPAY_BANKS.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Recipient Account Number</Label>
                      <Input
                        placeholder="Enter recipient's account number"
                        value={recipientAccountNumber}
                        onChange={(e) => setRecipientAccountNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Recipient Account Name</Label>
                      <Input
                        placeholder="Enter recipient's full name"
                        value={recipientAccountName}
                        onChange={(e) => setRecipientAccountName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (PHP)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (parseFloat(val) > 50000) {
                            toast.error("Instapay limit is ₱50,000 per transaction");
                          }
                          setAmount(val);
                        }}
                        min="0.01"
                        max="50000"
                        step="0.01"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum: ₱50,000 per transaction
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransaction}
              disabled={isPending || !selectedAccountId || !amount}
              className={
                transactionType === "deposit"
                  ? "bg-green-600 hover:bg-green-700"
                  : transactionType === "withdraw"
                  ? "bg-red-600 hover:bg-red-700"
                  : transferType === "interbank"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {transactionType === "deposit" && "Process Deposit"}
              {transactionType === "withdraw" && "Process Withdrawal"}
              {transactionType === "transfer" && transferType === "intrabank" && "Process Transfer"}
              {transactionType === "transfer" && transferType === "interbank" && "Send via Instapay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

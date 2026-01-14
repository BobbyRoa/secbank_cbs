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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Search, CreditCard, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AccountsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.account.list.useQuery();
  const { data: customers } = trpc.customer.list.useQuery();
  const { data: branches } = trpc.branch.list.useQuery();

  const createAccount = trpc.account.create.useMutation({
    onSuccess: (account) => {
      toast.success(`Account ${account?.accountNumber} created successfully`);
      utils.account.list.invalidate();
      utils.customer.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsCreateOpen(false);
      setSelectedCustomerId("");
      setSelectedBranchCode("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatus = trpc.account.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Account status updated");
      utils.account.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredAccounts = accounts?.filter(
    (account) =>
      account.accountNumber.includes(searchTerm) ||
      account.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const handleCreate = () => {
    if (!selectedCustomerId || !selectedBranchCode) {
      toast.error("Please select a customer and branch");
      return;
    }
    createAccount.mutate({
      customerId: parseInt(selectedCustomerId),
      branchCode: selectedBranchCode,
    });
  };

  const toggleStatus = (accountId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    updateStatus.mutate({ id: accountId, status: newStatus as "active" | "closed" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Accounts</h1>
            <p className="text-muted-foreground">Manage customer accounts</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Open Account
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by account number, customer, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Account List</CardTitle>
            <CardDescription>
              {filteredAccounts?.length || 0} accounts found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredAccounts && filteredAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono font-medium">
                        {account.accountNumber}
                      </TableCell>
                      <TableCell>{account.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {account.branchCode}
                          </span>
                          {account.branchName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{account.productType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={account.status === "active" ? "default" : "destructive"}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(account.id, account.status)}
                        >
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(account.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/admin/transactions?account=${account.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No accounts found</p>
                <p className="text-sm">Click "Open Account" to create one</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open New Account</DialogTitle>
            <DialogDescription>
              Create a new savings account for a customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!customers || customers.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No customers available. Create a customer first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedBranchCode} onValueChange={setSelectedBranchCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.code} value={branch.code}>
                      {branch.code} - {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!branches || branches.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No branches available. Seed branches from the dashboard.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Input value="REGULAR_SAVING" disabled />
              <p className="text-xs text-muted-foreground">
                All new accounts are opened as Regular Savings accounts.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createAccount.isPending || !selectedCustomerId || !selectedBranchCode}
            >
              {createAccount.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Open Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

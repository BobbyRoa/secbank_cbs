import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading, refetch, isRefetching } = trpc.dashboard.stats.useQuery();
  const seedBranches = trpc.branch.seed.useMutation({
    onSuccess: () => {
      toast.success("Branches seeded successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(num);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to Secbank Core Banking System</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => seedBranches.mutate()}
              disabled={seedBranches.isPending}
            >
              {seedBranches.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Seed Branches
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Customers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered customers
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Accounts
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAccounts || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active accounts
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Deposits
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.totalBalance || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all branches
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Branches
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.branchBalances?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active branches
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Today's Transactions</CardTitle>
                  <CardDescription>Transaction summary for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">Deposits</p>
                          <p className="text-sm text-green-600">
                            {stats?.todayTransactions?.deposits?.count || 0} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-800">
                          {formatCurrency(stats?.todayTransactions?.deposits?.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-red-800">Withdrawals</p>
                          <p className="text-sm text-red-600">
                            {stats?.todayTransactions?.withdrawals?.count || 0} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-800">
                          {formatCurrency(stats?.todayTransactions?.withdrawals?.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ArrowUpRight className="h-4 w-4 text-blue-600 rotate-45" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Transfers</p>
                          <p className="text-sm text-blue-600">
                            {stats?.todayTransactions?.internalTransfers?.count || 0} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-800">
                          {formatCurrency(stats?.todayTransactions?.internalTransfers?.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Today</span>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatCurrency(stats?.todayTransactions?.totalAmount || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {stats?.todayTransactions?.total || 0} transactions
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branch Balances */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Branch Balances</CardTitle>
                  <CardDescription>Deposits by branch</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.branchBalances && stats.branchBalances.length > 0 ? (
                      stats.branchBalances.map((branch) => (
                        <div 
                          key={branch.code} 
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{branch.code}</span>
                            </div>
                            <div>
                              <p className="font-medium">{branch.name}</p>
                              <p className="text-xs text-muted-foreground">Branch {branch.code}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(branch.balance)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No branches found</p>
                        <p className="text-sm">Click "Seed Branches" to add default branches</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common banking operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setLocation("/admin/customers")}
                  >
                    <Users className="h-5 w-5" />
                    <span>Manage Customers</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setLocation("/admin/accounts")}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Open Account</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setLocation("/admin/transactions")}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>Process Transaction</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setLocation("/admin/branches")}
                  >
                    <Building2 className="h-5 w-5" />
                    <span>View Branches</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

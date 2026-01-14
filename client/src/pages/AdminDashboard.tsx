import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { LogOut, Users, CreditCard, TrendingUp, Settings, Home } from "lucide-react";

/**
 * Secbank Admin Dashboard
 * 
 * Displays after successful login
 * Shows banking system overview and quick actions
 */

export default function AdminDashboard() {
  const { user, isAuthenticated, logout, isDemoMode } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Secbank</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-foreground">{user?.username || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-primary">Welcome back, {user?.username || 'Admin'}!</h2>
            <p className="text-lg text-muted-foreground">
              Manage your banking operations from the Secbank core system
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Customers</span>
                  <Users className="h-5 w-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">—</div>
                <p className="text-xs text-muted-foreground mt-1">Connected to backend</p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Accounts</span>
                  <CreditCard className="h-5 w-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">—</div>
                <p className="text-xs text-muted-foreground mt-1">Connected to backend</p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Deposits</span>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">—</div>
                <p className="text-xs text-muted-foreground mt-1">Connected to backend</p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Branches</span>
                  <Home className="h-5 w-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">5</div>
                <p className="text-xs text-muted-foreground mt-1">Active branches</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-border hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-accent transition-colors">
                    <Users className="h-5 w-5" />
                    Manage Customers
                  </CardTitle>
                  <CardDescription>Create and manage customer profiles</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-accent transition-colors">
                    <CreditCard className="h-5 w-5" />
                    Open Accounts
                  </CardTitle>
                  <CardDescription>Create new customer accounts</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-accent transition-colors">
                    <TrendingUp className="h-5 w-5" />
                    Process Transactions
                  </CardTitle>
                  <CardDescription>Handle deposits and withdrawals</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-accent transition-colors">
                    <Home className="h-5 w-5" />
                    Branch Operations
                  </CardTitle>
                  <CardDescription>View branch-specific data</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-accent transition-colors">
                    <TrendingUp className="h-5 w-5" />
                    View Reports
                  </CardTitle>
                  <CardDescription>Analytics and transaction reports</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-accent transition-colors">
                    <Settings className="h-5 w-5" />
                    Settings
                  </CardTitle>
                  <CardDescription>System configuration</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Demo Mode Banner */}
          {isDemoMode && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <span className="text-lg">🎮</span>
                  Demo Mode Active
                </CardTitle>
                <CardDescription className="text-amber-700">
                  You are logged in using demo credentials. To connect to the real Secbank backend, deploy the core banking system and the authentication will automatically switch to live mode.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Information Box */}
          <Card className={isDemoMode ? "border-amber-200 bg-amber-50/50" : "border-accent/20 bg-accent/5"}>
            <CardHeader>
              <CardTitle className="text-primary">
                {isDemoMode ? 'Demo Mode - Secbank Preview' : 'Connected to Secbank Backend'}
              </CardTitle>
              <CardDescription>
                {isDemoMode 
                  ? 'This is a preview of the Secbank admin dashboard. Deploy the backend to enable full functionality with real data.'
                  : 'This dashboard is connected to the full Secbank core banking system. To access the complete admin interface with all features, you can access the main Secbank application.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-accent/20">
                  <p className="text-sm font-semibold text-primary mb-1">Backend Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isDemoMode ? '⚠️ Demo mode - Backend not connected' : '✓ Connected and ready'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-accent/20">
                  <p className="text-sm font-semibold text-primary mb-1">Available Features</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{isDemoMode ? '○' : '✓'} Customer Management</li>
                    <li>{isDemoMode ? '○' : '✓'} Account Operations</li>
                    <li>{isDemoMode ? '○' : '✓'} Transaction Processing</li>
                    <li>{isDemoMode ? '○' : '✓'} Real-time Analytics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="border-primary text-primary hover:bg-primary/5"
            >
              Back to Home
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

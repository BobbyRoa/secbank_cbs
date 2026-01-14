import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCustomers from "./pages/admin/Customers";
import AdminAccounts from "./pages/admin/Accounts";
import AdminTransactions from "./pages/admin/Transactions";
import AdminBranches from "./pages/admin/Branches";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      
      {/* Admin routes - protected by AdminLayout */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/customers"} component={AdminCustomers} />
      <Route path={"/admin/accounts"} component={AdminAccounts} />
      <Route path={"/admin/transactions"} component={AdminTransactions} />
      <Route path={"/admin/branches"} component={AdminBranches} />
      
      {/* Fallback routes */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

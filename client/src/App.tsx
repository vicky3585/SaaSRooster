import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import Customers from "@/pages/Customers";
import Inventory from "@/pages/Inventory";
import Expenses from "@/pages/Expenses";
import Staff from "@/pages/Staff";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Leads from "@/pages/Leads";
import Accounts from "@/pages/Accounts";
import Contacts from "@/pages/Contacts";
import Deals from "@/pages/Deals";
import ChartOfAccounts from "@/pages/ChartOfAccounts";
import NotFound from "@/pages/not-found";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Component />;
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} />} />
      <Route path="/customers" component={() => <ProtectedRoute component={Customers} />} />
      <Route path="/leads" component={() => <ProtectedRoute component={Leads} />} />
      <Route path="/accounts" component={() => <ProtectedRoute component={Accounts} />} />
      <Route path="/contacts" component={() => <ProtectedRoute component={Contacts} />} />
      <Route path="/deals" component={() => <ProtectedRoute component={Deals} />} />
      <Route path="/chart-of-accounts" component={() => <ProtectedRoute component={ChartOfAccounts} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={Expenses} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={Staff} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route component={() => <Redirect to="/login" />} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <AuthenticatedRouter /> : <PublicRouter />;
}

function AppContent() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Router />
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1 flex justify-center px-4">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-2">
              <OrgSwitcher />
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

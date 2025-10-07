import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Lock,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminOrganizations from "@/components/admin/AdminOrganizations";
import AdminSubscriptionPlans from "@/components/admin/AdminSubscriptionPlans";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminPasswordChange from "@/components/admin/AdminPasswordChange";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { name: "Organizations", icon: Users, id: "organizations" },
  { name: "Subscription Plans", icon: Package, id: "plans" },
  { name: "Settings", icon: Settings, id: "settings" },
  { name: "Change Password", icon: Lock, id: "password" },
];

// Admin API request helper
export async function adminApiRequest(method: string, url: string, data?: any) {
  const adminToken = localStorage.getItem("adminAccessToken");
  
  if (!adminToken) {
    throw new Error("Admin authentication required");
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("adminAccessToken");
      window.location.href = "/admin/login";
      throw new Error("Admin session expired");
    }
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: admin } = useQuery({
    queryKey: ["/api/admin/auth/me"],
    queryFn: () => adminApiRequest("GET", "/api/admin/auth/me"),
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAccessToken");
    setLocation("/admin/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "organizations":
        return <AdminOrganizations />;
      case "plans":
        return <AdminSubscriptionPlans />;
      case "settings":
        return <AdminSettings />;
      case "password":
        return <AdminPasswordChange />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Bizverse Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform Administration
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
              data-testid={`button-admin-nav-${item.id}`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          {admin && (
            <div className="mb-3 px-3 py-2 bg-muted rounded-md">
              <p className="text-sm font-medium">{admin.user.name}</p>
              <p className="text-xs text-muted-foreground">{admin.user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Package,
  TrendingDown,
  UserCog,
  Settings,
  Building2,
  ChevronDown,
  ChevronRight,
  Target,
  UserCircle,
  Briefcase,
  BookOpen,
  Headphones,
  ShoppingCart,
  Store,
  Wrench,
  Database,
  FileCheck,
  RotateCcw,
  Truck,
  FileSpreadsheet,
  CreditCard,
  StickyNote,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

const saleSubItems = [
  { title: "Invoice", url: "/invoices", icon: Receipt },
  { title: "Sale Return", url: "/sale-return", icon: RotateCcw },
  { title: "Quotation", url: "/quotations", icon: FileCheck },
  { title: "Delivery Note", url: "/delivery-notes", icon: Truck },
  { title: "Proforma Invoice", url: "/proforma", icon: FileSpreadsheet },
  { title: "Sale Order", url: "/sale-orders", icon: ShoppingCart },
  { title: "Credit Note", url: "/credit-notes", icon: CreditCard },
  { title: "Debit Note", url: "/debit-notes", icon: StickyNote },
];

const purchaseSubItems = [
  { title: "Purchase Order", url: "/purchase-orders", icon: ShoppingCart },
  { title: "Purchase Invoice", url: "/purchase-invoices", icon: Receipt },
  { title: "Purchase Return", url: "/purchase-return", icon: RotateCcw },
  { title: "Debit Note", url: "/purchase-debit-notes", icon: StickyNote },
];

const accountsSubItems = [
  { title: "Chart of Accounts", url: "/chart-of-accounts", icon: BookOpen },
  { title: "Journals", url: "/journals", icon: FileText },
  { title: "Trial Balance", url: "/trial-balance", icon: FileSpreadsheet },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const [saleOpen, setSaleOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);

  const handleNavigation = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(url);
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-md">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-sidebar-foreground">Ledgix</h2>
            <p className="text-[10px] text-sidebar-foreground/60">Ledger + Logic</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {/* Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/"}
                data-testid="nav-dashboard"
              >
                <a href="/" onClick={handleNavigation("/")}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Sale with submenu */}
            <Collapsible open={saleOpen} onOpenChange={setSaleOpen}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton data-testid="nav-sale">
                    <Receipt className="w-4 h-4" />
                    <span>Sale</span>
                    {saleOpen ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {saleSubItems.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === item.url}
                        >
                          <a href={item.url} onClick={handleNavigation(item.url)}>
                            <item.icon className="w-3 h-3" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* Online Store */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/online-store"}
                data-testid="nav-online-store"
              >
                <a href="/online-store" onClick={handleNavigation("/online-store")}>
                  <Store className="w-4 h-4" />
                  <span>Online Store</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Purchase with submenu */}
            <Collapsible open={purchaseOpen} onOpenChange={setPurchaseOpen}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton data-testid="nav-purchase">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Purchase</span>
                    {purchaseOpen ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {purchaseSubItems.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === item.url}
                        >
                          <a href={item.url} onClick={handleNavigation(item.url)}>
                            <item.icon className="w-3 h-3" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* Inventory */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/inventory"}
                data-testid="nav-inventory"
              >
                <a href="/inventory" onClick={handleNavigation("/inventory")}>
                  <Package className="w-4 h-4" />
                  <span>Inventory</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Accounts with submenu */}
            <Collapsible open={accountsOpen} onOpenChange={setAccountsOpen}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton data-testid="nav-accounts">
                    <BookOpen className="w-4 h-4" />
                    <span>Accounts</span>
                    {accountsOpen ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {accountsSubItems.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === item.url}
                        >
                          <a href={item.url} onClick={handleNavigation(item.url)}>
                            <item.icon className="w-3 h-3" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* Expense */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/expenses"}
                data-testid="nav-expense"
              >
                <a href="/expenses" onClick={handleNavigation("/expenses")}>
                  <TrendingDown className="w-4 h-4" />
                  <span>Expense</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Customer */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/customers"}
                data-testid="nav-customer"
              >
                <a href="/customers" onClick={handleNavigation("/customers")}>
                  <Users className="w-4 h-4" />
                  <span>Customer</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* CRM Section */}
            <SidebarGroupLabel className="mt-4">CRM</SidebarGroupLabel>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/leads"}
                data-testid="nav-leads"
              >
                <a href="/leads" onClick={handleNavigation("/leads")}>
                  <Target className="w-4 h-4" />
                  <span>Leads</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/deals"}
                data-testid="nav-deals"
              >
                <a href="/deals" onClick={handleNavigation("/deals")}>
                  <Briefcase className="w-4 h-4" />
                  <span>Deals</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/accounts"}
                data-testid="nav-crm-accounts"
              >
                <a href="/accounts" onClick={handleNavigation("/accounts")}>
                  <Building2 className="w-4 h-4" />
                  <span>Accounts</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/contacts"}
                data-testid="nav-contacts"
              >
                <a href="/contacts" onClick={handleNavigation("/contacts")}>
                  <UserCircle className="w-4 h-4" />
                  <span>Contacts</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/tickets"}
                data-testid="nav-tickets"
              >
                <a href="/tickets" onClick={handleNavigation("/tickets")}>
                  <Headphones className="w-4 h-4" />
                  <span>Tickets</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Management Section */}
            <SidebarGroupLabel className="mt-4">Management</SidebarGroupLabel>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/reports"}
                data-testid="nav-reports"
              >
                <a href="/reports" onClick={handleNavigation("/reports")}>
                  <FileText className="w-4 h-4" />
                  <span>Reports</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/staff"}
                data-testid="nav-staff"
              >
                <a href="/staff" onClick={handleNavigation("/staff")}>
                  <UserCog className="w-4 h-4" />
                  <span>Staff</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/tools"}
                data-testid="nav-tools"
              >
                <a href="/tools" onClick={handleNavigation("/tools")}>
                  <Wrench className="w-4 h-4" />
                  <span>Tools</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/master"}
                data-testid="nav-master"
              >
                <a href="/master" onClick={handleNavigation("/master")}>
                  <Database className="w-4 h-4" />
                  <span>Master</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/settings"}
                data-testid="nav-settings"
              >
                <a href="/settings" onClick={handleNavigation("/settings")}>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

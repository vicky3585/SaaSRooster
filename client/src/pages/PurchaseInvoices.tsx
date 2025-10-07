import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function PurchaseInvoices() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 space-y-6" data-testid="page-purchase-invoices">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Invoices</h1>
          <p className="text-muted-foreground mt-1">Track and manage vendor invoices</p>
        </div>
        <Button data-testid="button-create-purchase-invoice">
          <Plus className="w-4 h-4 mr-2" />
          New Purchase Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-md">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-md">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Pending Payment</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-md">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹0</p>
              <p className="text-sm text-muted-foreground">Amount Due</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12">
        <div className="text-center">
          <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Purchase Invoices Yet</h3>
          <p className="text-muted-foreground mb-6">
            Record vendor invoices to track your payables and manage cash flow
          </p>
          <Button size="lg" data-testid="button-create-first-purchase-invoice">
            <Plus className="w-4 h-4 mr-2" />
            Record First Purchase Invoice
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Record Purchase Invoice
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/expenses")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Record Expense
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/vendors")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Purchase Invoice Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Record vendor invoices</li>
            <li>✓ Track payment status</li>
            <li>✓ GST input credit tracking</li>
            <li>✓ Payment terms management</li>
            <li>✓ Multi-item invoices</li>
            <li>✓ Vendor-wise reports</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

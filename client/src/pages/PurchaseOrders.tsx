import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function PurchaseOrders() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 space-y-6" data-testid="page-purchase-orders">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage your purchase orders and procurement</p>
        </div>
        <Button data-testid="button-create-purchase-order">
          <Plus className="w-4 h-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹0</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Purchase Orders Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start managing your procurement by creating your first purchase order
          </p>
          <Button size="lg" data-testid="button-create-first-purchase-order">
            <Plus className="w-4 h-4 mr-2" />
            Create First Purchase Order
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Create Purchase Order
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/vendors")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/inventory")}
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Inventory
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Purchase Order Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Create and track purchase orders</li>
            <li>✓ Vendor management</li>
            <li>✓ Delivery tracking</li>
            <li>✓ Payment terms</li>
            <li>✓ Multi-item orders with GST</li>
            <li>✓ Purchase history</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

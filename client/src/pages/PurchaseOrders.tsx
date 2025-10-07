import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Package, Pencil, Trash2, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { PurchaseOrder, Vendor, Item } from "@shared/schema";

interface PurchaseOrderItem {
  itemId: string | null;
  description: string;
  hsnCode: string;
  quantity: string;
  rate: string;
  taxRate: string;
  amount: string;
  taxAmount: string;
  total: string;
}

export default function PurchaseOrders() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [orderDate, setOrderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [status, setStatus] = useState<"draft" | "sent" | "confirmed" | "partially_received" | "received" | "cancelled">("draft");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: allItems = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  const totalTax = items.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
  const total = subtotal + totalTax;

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/purchase-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/purchase-orders/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
    setVendorId("");
    setOrderDate(format(new Date(), "yyyy-MM-dd"));
    setDeliveryDate(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
    setStatus("draft");
    setPaymentTerms("");
    setNotes("");
    setItems([]);
  };

  const handleEdit = async (order: PurchaseOrder) => {
    setEditingOrder(order);
    setVendorId(order.vendorId);
    setOrderDate(format(new Date(order.orderDate), "yyyy-MM-dd"));
    setDeliveryDate(format(new Date(order.deliveryDate), "yyyy-MM-dd"));
    setStatus(order.status as any);
    setPaymentTerms(order.paymentTerms || "");
    setNotes(order.notes || "");

    // Fetch items
    try {
      const response = await apiRequest(`/api/purchase-orders/${order.id}/items`);
      const orderItems = await response.json();
      setItems(orderItems.map((item: any) => ({
        itemId: item.itemId,
        description: item.description,
        hsnCode: item.hsnCode || "",
        quantity: item.quantity,
        rate: item.rate,
        taxRate: item.taxRate || "0",
        amount: item.amount,
        taxAmount: item.taxAmount || "0",
        total: item.total,
      })));
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }

    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete);
    }
  };

  const handleSubmit = () => {
    if (!vendorId) {
      toast({
        title: "Validation Error",
        description: "Please select a vendor",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    const data = {
      vendorId,
      orderDate: new Date(orderDate),
      deliveryDate: new Date(deliveryDate),
      status,
      paymentTerms,
      notes,
      subtotal: subtotal.toFixed(2),
      taxAmount: totalTax.toFixed(2),
      total: total.toFixed(2),
      items,
    };

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addItem = () => {
    setItems([...items, {
      itemId: null,
      description: "",
      hsnCode: "",
      quantity: "1",
      rate: "0",
      taxRate: "18",
      amount: "0",
      taxAmount: "0",
      total: "0",
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "itemId" && value) {
      const item = allItems.find(i => i.id === value);
      if (item) {
        newItems[index].description = item.name;
        newItems[index].hsnCode = item.hsn || "";
        newItems[index].rate = item.salePrice || "0";
      }
    }

    // Always recalculate when quantity, rate, taxRate, or itemId changes
    if (field === "quantity" || field === "rate" || field === "taxRate" || field === "itemId") {
      const qty = parseFloat(newItems[index].quantity || "0");
      const rate = parseFloat(newItems[index].rate || "0");
      const taxRate = parseFloat(newItems[index].taxRate || "0");
      
      const amount = qty * rate;
      const taxAmount = (amount * taxRate) / 100;
      
      newItems[index].amount = amount.toFixed(2);
      newItems[index].taxAmount = taxAmount.toFixed(2);
      newItems[index].total = (amount + taxAmount).toFixed(2);
    }

    setItems(newItems);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "sent": return "default";
      case "confirmed": return "default";
      case "partially_received": return "default";
      case "received": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Draft";
      case "sent": return "Sent";
      case "confirmed": return "Confirmed";
      case "partially_received": return "Partially Received";
      case "received": return "Received";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const pendingOrders = orders.filter(o => o.status === "sent" || o.status === "confirmed" || o.status === "partially_received");
  const totalValue = orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);

  if (ordersLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-purchase-orders">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage your purchase orders and procurement</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-purchase-order">
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
              <p className="text-2xl font-bold" data-testid="text-total-orders">{orders.length}</p>
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
              <p className="text-2xl font-bold" data-testid="text-pending-orders">{pendingOrders.length}</p>
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
              <p className="text-2xl font-bold" data-testid="text-total-value">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </div>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Purchase Orders Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start managing your procurement by creating your first purchase order
            </p>
            <Button size="lg" onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-purchase-order">
              <Plus className="w-4 h-4 mr-2" />
              Create First Purchase Order
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const vendor = vendors.find(v => v.id === order.vendorId);
                return (
                  <TableRow key={order.id} data-testid={`row-purchase-order-${order.id}`}>
                    <TableCell>{format(new Date(order.orderDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>{vendor?.name || "Unknown"}</TableCell>
                    <TableCell>{format(new Date(order.deliveryDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} data-testid={`badge-status-${order.id}`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{parseFloat(order.total || "0").toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(order)}
                          data-testid={`button-edit-${order.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(order.id)}
                          data-testid={`button-delete-${order.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
            <DialogDescription>
              {editingOrder ? "Update purchase order details" : "Enter purchase order details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger id="vendor" data-testid="select-vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="partially_received">Partially Received</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  data-testid="input-order-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  data-testid="input-delivery-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., Net 30"
                data-testid="input-payment-terms"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item</Label>
                        <Select
                          value={item.itemId || ""}
                          onValueChange={(v) => updateItem(index, "itemId", v)}
                        >
                          <SelectTrigger data-testid={`select-item-${index}`}>
                            <SelectValue placeholder="Select item (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {allItems.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>HSN Code</Label>
                        <Input
                          value={item.hsnCode}
                          onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                          placeholder="HSN Code"
                          data-testid={`input-hsn-${index}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        data-testid={`input-description-${index}`}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          data-testid={`input-quantity-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Rate</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(index, "rate", e.target.value)}
                          data-testid={`input-rate-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateItem(index, "taxRate", e.target.value)}
                          data-testid={`input-tax-rate-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <Input
                          value={item.total}
                          disabled
                          data-testid={`input-total-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                data-testid="textarea-notes"
              />
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span data-testid="text-tax">₹{totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span data-testid="text-dialog-total">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingOrder ? "Update Order" : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

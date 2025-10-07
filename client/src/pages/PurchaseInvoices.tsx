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
import { Receipt, Plus, TrendingUp, AlertCircle, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { PurchaseInvoice, Vendor, Item } from "@shared/schema";

interface PurchaseInvoiceItem {
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

export default function PurchaseInvoices() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [status, setStatus] = useState<"draft" | "sent" | "overdue" | "paid" | "partial" | "void">("draft");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);

  // Queries
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<PurchaseInvoice[]>({
    queryKey: ["/api/purchase-invoices"],
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
      return await apiRequest("/api/purchase-invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      toast({
        title: "Success",
        description: "Purchase invoice created successfully",
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
      return await apiRequest(`/api/purchase-invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      toast({
        title: "Success",
        description: "Purchase invoice updated successfully",
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
      return await apiRequest(`/api/purchase-invoices/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      toast({
        title: "Success",
        description: "Purchase invoice deleted successfully",
      });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
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
    setEditingInvoice(null);
    setVendorId("");
    setInvoiceNumber("");
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
    setStatus("draft");
    setNotes("");
    setItems([]);
  };

  const handleEdit = async (invoice: PurchaseInvoice) => {
    setEditingInvoice(invoice);
    setVendorId(invoice.vendorId);
    setInvoiceNumber(invoice.invoiceNumber || "");
    setInvoiceDate(format(new Date(invoice.invoiceDate), "yyyy-MM-dd"));
    setDueDate(format(new Date(invoice.dueDate), "yyyy-MM-dd"));
    setStatus(invoice.status as any);
    setNotes(invoice.notes || "");

    // Fetch items
    try {
      const response = await apiRequest(`/api/purchase-invoices/${invoice.id}/items`);
      const invoiceItems = await response.json();
      setItems(invoiceItems.map((item: any) => ({
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
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteMutation.mutate(invoiceToDelete);
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

    if (!invoiceNumber) {
      toast({
        title: "Validation Error",
        description: "Please enter an invoice number",
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
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      status,
      notes,
      subtotal: subtotal.toFixed(2),
      taxAmount: totalTax.toFixed(2),
      total: total.toFixed(2),
      amountDue: total.toFixed(2),
      items,
    };

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
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

  const updateItem = (index: number, field: keyof PurchaseInvoiceItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "itemId" && value) {
      const item = allItems.find(i => i.id === value);
      if (item) {
        newItems[index].description = item.name;
        newItems[index].hsnCode = item.hsn || "";
        newItems[index].rate = item.purchasePrice || item.salePrice || "0";
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
      case "paid": return "default";
      case "partial": return "default";
      case "overdue": return "destructive";
      case "void": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Draft";
      case "sent": return "Sent";
      case "paid": return "Paid";
      case "partial": return "Partial";
      case "overdue": return "Overdue";
      case "void": return "Void";
      default: return status;
    }
  };

  const unpaidInvoices = invoices.filter(i => i.status === "sent" || i.status === "partial" || i.status === "overdue");
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalDue = unpaidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amountDue || "0"), 0);

  if (invoicesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-purchase-invoices">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Invoices</h1>
          <p className="text-muted-foreground mt-1">Track and manage vendor invoices</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-purchase-invoice">
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
              <p className="text-2xl font-bold" data-testid="text-total-invoices">{invoices.length}</p>
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
              <p className="text-2xl font-bold" data-testid="text-pending-payment">{unpaidInvoices.length}</p>
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
              <p className="text-2xl font-bold" data-testid="text-paid-invoices">{paidInvoices.length}</p>
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
              <p className="text-2xl font-bold" data-testid="text-amount-due">₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">Amount Due</p>
            </div>
          </div>
        </Card>
      </div>

      {invoices.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Purchase Invoices Yet</h3>
            <p className="text-muted-foreground mb-6">
              Record vendor invoices to track your payables and manage cash flow
            </p>
            <Button size="lg" onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-purchase-invoice">
              <Plus className="w-4 h-4 mr-2" />
              Record First Purchase Invoice
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const vendor = vendors.find(v => v.id === invoice.vendorId);
                return (
                  <TableRow key={invoice.id} data-testid={`row-purchase-invoice-${invoice.id}`}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{vendor?.name || "Unknown"}</TableCell>
                    <TableCell>{format(new Date(invoice.invoiceDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)} data-testid={`badge-status-${invoice.id}`}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{parseFloat(invoice.total || "0").toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(invoice)}
                          data-testid={`button-edit-${invoice.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
                          data-testid={`button-delete-${invoice.id}`}
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
            <DialogTitle>{editingInvoice ? "Edit Purchase Invoice" : "Create Purchase Invoice"}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? "Update purchase invoice details" : "Enter purchase invoice details"}
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
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                  data-testid="input-invoice-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  data-testid="input-invoice-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-due-date"
                />
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
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingInvoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase invoice.
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

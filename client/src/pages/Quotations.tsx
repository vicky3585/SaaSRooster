import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, Edit, Trash2, Send, FileCheck, X, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Customer, Item } from "@shared/schema";
import { format } from "date-fns";

export default function Quotations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingQuotation, setConvertingQuotation] = useState<Invoice | null>(null);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");
  const { toast } = useToast();

  // Fetch data
  const { data: quotations = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Fetch next quotation number
  const { data: quotationNumberData } = useQuery<{ quotationNumber: string }>({
    queryKey: ["/api/invoices/next-quotation-number"],
    enabled: dialogOpen,
  });

  // Fetch next invoice number for conversion
  const { data: nextInvoiceNumberData } = useQuery<{ invoiceNumber: string }>({
    queryKey: ["/api/invoices/next-number"],
    enabled: convertDialogOpen,
  });

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<Array<{
    itemId: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>>([]);

  // Sync new invoice number when data is available
  useEffect(() => {
    if (nextInvoiceNumberData?.invoiceNumber) {
      setNewInvoiceNumber(nextInvoiceNumberData.invoiceNumber);
    }
  }, [nextInvoiceNumberData]);

  // Filter for quotations (draft invoices)
  const filteredQuotations = quotations
    .filter(q => q.status === "draft")
    .filter(q => 
      !searchQuery || 
      q.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices/quotations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/next-quotation-number"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Quotation created",
        description: "Quotation has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create quotation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Quotation deleted",
        description: "Quotation has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete quotation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async ({ id, invoiceNumber }: { id: string; invoiceNumber: string }) => {
      const response = await apiRequest("PATCH", `/api/invoices/${id}`, {
        status: "sent",
        invoiceNumber: invoiceNumber,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/next-number"] });
      setConvertDialogOpen(false);
      setConvertingQuotation(null);
      setNewInvoiceNumber("");
      toast({
        title: "Converted to invoice",
        description: "Quotation has been converted to an invoice successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert quotation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerId("");
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setNotes("");
    setLineItems([]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      itemId: "",
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    
    // Auto-fill from item selection
    if (field === 'itemId' && value) {
      const item = items.find(i => i.id === value);
      if (item) {
        updated[index].description = item.name;
        updated[index].rate = parseFloat(item.price);
        updated[index].amount = updated[index].quantity * parseFloat(item.price);
      }
    }
    
    setLineItems(updated);
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 0.18; // 18% GST
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Customer required",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        title: "Items required",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    const { subtotal, tax, total } = calculateTotal();

    createQuotationMutation.mutate({
      customerId,
      invoiceDate,
      dueDate,
      subtotal: subtotal.toString(),
      taxAmount: tax.toString(),
      total: total.toString(),
      status: "draft",
      notes,
      items: lineItems.map(item => ({
        itemId: item.itemId,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate.toString(),
        amount: item.amount.toString(),
      })),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvertToInvoice = (quotation: Invoice) => {
    setConvertingQuotation(quotation);
    setConvertDialogOpen(true);
  };

  const handleDownloadPDF = async (quotation: Invoice) => {
    try {
      const makeRequest = async (token: string | null) => {
        const headers: Record<string, string> = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        return await fetch(`/api/invoices/${quotation.id}/pdf`, {
          headers,
          credentials: 'include',
        });
      };

      let accessToken = localStorage.getItem('accessToken');
      let response = await makeRequest(accessToken);

      // Handle token refresh if unauthorized
      if (response.status === 401) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.accessToken) {
              localStorage.setItem('accessToken', refreshData.accessToken);
              response = await makeRequest(refreshData.accessToken);
            }
          }
        } catch (refreshError) {
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotation.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF downloaded",
        description: "Quotation PDF has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to download PDF",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const confirmConvertToInvoice = () => {
    if (!convertingQuotation || !newInvoiceNumber) return;
    
    convertToInvoiceMutation.mutate({ 
      id: convertingQuotation.id,
      invoiceNumber: newInvoiceNumber
    });
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="p-6 space-y-6" data-testid="page-quotations">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground mt-1">Manage your sales quotations</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-quotation">
          <Plus className="w-4 h-4 mr-2" />
          New Quotation
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quotation</DialogTitle>
          </DialogHeader>

          {/* Quotation Number Display */}
          {quotationNumberData && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quotation Number</p>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {quotationNumberData.quotationNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">Draft</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer" data-testid="select-customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-date">Quotation Date *</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  data-testid="input-invoice-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-date">Valid Until *</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-due-date"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {lineItems.map((lineItem, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Item</Label>
                        <Select
                          value={lineItem.itemId}
                          onValueChange={(value) => updateLineItem(index, 'itemId', value)}
                        >
                          <SelectTrigger data-testid={`select-item-${index}`}>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={lineItem.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          data-testid={`input-description-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={lineItem.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                          data-testid={`input-quantity-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Rate (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={lineItem.rate}
                          onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value))}
                          data-testid={`input-rate-${index}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`₹${lineItem.amount.toFixed(2)}`}
                          disabled
                          className="w-32"
                          data-testid={`text-amount-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(index)}
                          data-testid={`button-remove-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {lineItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                  No items added. Click "Add Item" to get started.
                </div>
              )}
            </div>

            {/* Totals */}
            {lineItems.length > 0 && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST (18%):</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or terms..."
                data-testid="input-notes"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createQuotationMutation.isPending}
                data-testid="button-save-quotation"
              >
                {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-quotations"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quotations found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setDialogOpen(true)}
              data-testid="button-create-first-quotation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Quotation
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id} data-testid={`row-quotation-${quotation.id}`}>
                  <TableCell className="font-medium font-mono">
                    {quotation.invoiceNumber}
                  </TableCell>
                  <TableCell>{quotation.customerId}</TableCell>
                  <TableCell>
                    {format(new Date(quotation.invoiceDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(quotation.dueDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>₹{Number(quotation.total).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <StatusBadge status={quotation.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadPDF(quotation)}
                        data-testid={`button-download-${quotation.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleConvertToInvoice(quotation)}
                        data-testid={`button-convert-${quotation.id}`}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quotation.id)}
                        data-testid={`button-delete-${quotation.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Convert to Invoice Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
          </DialogHeader>

          {convertingQuotation && (
            <div className="space-y-6">
              {/* Quotation Details */}
              <div className="p-4 bg-muted/50 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quotation Number:</span>
                  <span className="font-mono font-medium">{convertingQuotation.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">₹{Number(convertingQuotation.total).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* New Invoice Number */}
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number *</Label>
                <Input
                  id="invoice-number"
                  value={newInvoiceNumber}
                  onChange={(e) => setNewInvoiceNumber(e.target.value)}
                  placeholder="INV-25-26-00001"
                  className="font-mono"
                  data-testid="input-invoice-number"
                />
                <p className="text-xs text-muted-foreground">
                  This will be the new invoice number. You can edit it if needed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConvertDialogOpen(false);
                    setConvertingQuotation(null);
                    setNewInvoiceNumber("");
                  }}
                  data-testid="button-cancel-convert"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmConvertToInvoice}
                  disabled={!newInvoiceNumber || convertToInvoiceMutation.isPending}
                  data-testid="button-confirm-convert"
                >
                  {convertToInvoiceMutation.isPending ? "Converting..." : "Convert to Invoice"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="text-sm text-muted-foreground">
        <p>
          💡 Tip: Quotations are draft invoices. Create a quotation and convert it to an invoice when accepted by the customer.
        </p>
      </div>
    </div>
  );
}

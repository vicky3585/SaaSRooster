import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, MoreVertical, Eye, Edit, Trash2, Download, Loader2, X, Sparkles, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Customer } from "@shared/schema";
import { format } from "date-fns";

const lineItemSchema = z.object({
  itemId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  hsnCode: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate cannot be negative"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
});

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  placeOfSupply: z.string().min(1, "Place of supply is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "partial", "void", "pending"]),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: items = [] } = useQuery<any[]>({
    queryKey: ["/api/items"],
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: "",
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      placeOfSupply: "",
      lineItems: [{ description: "", hsnCode: "", quantity: 1, rate: 0, taxRate: 18 }],
      status: "draft",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  // Fetch next invoice number when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      fetchNextInvoiceNumber();
    }
  }, [isDialogOpen]);

  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await apiRequest("GET", "/api/invoices/next-number");
      const data = await response.json();
      setNextInvoiceNumber(data.invoiceNumber);
    } catch (error) {
      console.error("Failed to fetch next invoice number:", error);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const lineItems = data.lineItems;
      
      // Calculate subtotal and tax
      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      
      const invoiceItems = lineItems.map(item => {
        const amount = item.quantity * item.rate;
        const taxAmount = (amount * item.taxRate) / 100;
        subtotal += amount;
        
        // Assume CGST/SGST for now (can be improved with state comparison)
        cgst += taxAmount / 2;
        sgst += taxAmount / 2;
        
        return {
          itemId: item.itemId,
          description: item.description,
          hsnCode: item.hsnCode || "",
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          taxRate: item.taxRate.toString(),
          amount: amount.toString(),
          taxAmount: taxAmount.toString(),
          total: (amount + taxAmount).toString(),
        };
      });
      
      const total = subtotal + cgst + sgst + igst;
      
      const payload = {
        customerId: data.customerId,
        invoiceDate: new Date(data.invoiceDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        placeOfSupply: data.placeOfSupply,
        subtotal: subtotal.toString(),
        cgst: cgst.toString(),
        sgst: sgst.toString(),
        igst: igst.toString(),
        total: total.toString(),
        amountDue: total.toString(),
        status: data.status,
        notes: data.notes,
        items: invoiceItems,
      };
      
      const response = await apiRequest("POST", "/api/invoices", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Invoice created",
        description: "Invoice has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      if (!selectedInvoice) return;
      
      const lineItems = data.lineItems;
      
      // Calculate subtotal and tax
      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      
      lineItems.forEach(item => {
        const amount = item.quantity * item.rate;
        const taxAmount = (amount * item.taxRate) / 100;
        subtotal += amount;
        cgst += taxAmount / 2;
        sgst += taxAmount / 2;
      });
      
      const total = subtotal + cgst + sgst + igst;
      
      const payload = {
        customerId: data.customerId,
        invoiceDate: new Date(data.invoiceDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        placeOfSupply: data.placeOfSupply,
        subtotal: subtotal.toString(),
        cgst: cgst.toString(),
        sgst: sgst.toString(),
        igst: igst.toString(),
        total: total.toString(),
        amountDue: total.toString(),
        status: data.status,
        notes: data.notes,
      };
      
      const response = await apiRequest("PATCH", `/api/invoices/${selectedInvoice.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedInvoice(null);
      toast({
        title: "Invoice updated",
        description: "Invoice has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
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
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invoice",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInvoice = () => {
    setDialogMode("create");
    setSelectedInvoice(null);
    form.reset({
      customerId: "",
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      placeOfSupply: "",
      lineItems: [{ description: "", hsnCode: "", quantity: 1, rate: 0, taxRate: 18 }],
      status: "draft",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const response = await apiRequest("GET", `/api/invoices/${invoice.id}`);
      const data = await response.json();
      setSelectedInvoice(data);
      setIsViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      const response = await apiRequest("GET", `/api/invoices/${invoice.id}`);
      const data = await response.json();
      setSelectedInvoice(data);
      setDialogMode("edit");
      
      // Populate form with invoice data
      const lineItems = data.items?.map((item: any) => ({
        itemId: item.itemId,
        description: item.description,
        hsnCode: item.hsnCode || "",
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        taxRate: Number(item.taxRate),
      })) || [];

      form.reset({
        customerId: data.customerId,
        invoiceDate: format(new Date(data.invoiceDate), "yyyy-MM-dd"),
        dueDate: format(new Date(data.dueDate), "yyyy-MM-dd"),
        placeOfSupply: data.placeOfSupply,
        lineItems: lineItems.length > 0 ? lineItems : [{ description: "", hsnCode: "", quantity: 1, rate: 0, taxRate: 18 }],
        status: data.status,
        notes: data.notes || "",
      });
      
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice for editing",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (values: InvoiceFormValues) => {
    if (dialogMode === "edit") {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = items.find(i => i.id === itemId);
    if (selectedItem) {
      form.setValue(`lineItems.${index}.itemId`, itemId);
      form.setValue(`lineItems.${index}.description`, selectedItem.name);
      form.setValue(`lineItems.${index}.hsnCode`, selectedItem.hsnCode || "");
      form.setValue(`lineItems.${index}.rate`, Number(selectedItem.price));
      form.setValue(`lineItems.${index}.taxRate`, Number(selectedItem.taxRate || 18));
    }
  };

  const calculateLineTotal = (index: number) => {
    const quantity = form.watch(`lineItems.${index}.quantity`) || 0;
    const rate = form.watch(`lineItems.${index}.rate`) || 0;
    const taxRate = form.watch(`lineItems.${index}.taxRate`) || 0;
    const amount = quantity * rate;
    const taxAmount = (amount * taxRate) / 100;
    return amount + taxAmount;
  };

  const calculateTotals = () => {
    const lineItems = form.watch("lineItems") || [];
    let subtotal = 0;
    let totalTax = 0;
    
    lineItems.forEach(item => {
      const amount = (item.quantity || 0) * (item.rate || 0);
      const taxAmount = (amount * (item.taxRate || 0)) / 100;
      subtotal += amount;
      totalTax += taxAmount;
    });
    
    return {
      subtotal,
      tax: totalTax,
      total: subtotal + totalTax,
    };
  };

  const totals = calculateTotals();

  // AI-powered suggestion functions
  const generateAIDescription = async (index: number) => {
    const itemId = form.watch(`lineItems.${index}.itemId`);
    if (!itemId) return;
    
    const selectedItem = items.find(i => i.id === itemId);
    if (!selectedItem) return;
    
    try {
      const response = await apiRequest("POST", "/api/ai/generate-description", {
        itemName: selectedItem.name,
      });
      const data = await response.json();
      form.setValue(`lineItems.${index}.description`, data.description);
      toast({
        title: "AI Generated",
        description: "Description generated successfully",
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to generate description",
        variant: "destructive",
      });
    }
  };

  const suggestAIHSN = async (index: number) => {
    const description = form.watch(`lineItems.${index}.description`);
    if (!description) return;
    
    try {
      const response = await apiRequest("POST", "/api/ai/suggest-hsn", {
        itemDescription: description,
      });
      const data = await response.json();
      if (data.code) {
        form.setValue(`lineItems.${index}.hsnCode`, data.code);
        toast({
          title: "AI Suggested",
          description: data.description || "HSN code suggested",
        });
      }
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to suggest HSN code",
        variant: "destructive",
      });
    }
  };

  const suggestAITaxRate = async (index: number) => {
    const description = form.watch(`lineItems.${index}.description`);
    if (!description) return;
    
    try {
      const response = await apiRequest("POST", "/api/ai/suggest-tax-rate", {
        itemDescription: description,
      });
      const data = await response.json();
      if (data.taxRate !== undefined) {
        form.setValue(`lineItems.${index}.taxRate`, data.taxRate);
        toast({
          title: "AI Suggested",
          description: `Tax rate: ${data.taxRate}%`,
        });
      }
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to suggest tax rate",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-invoices">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your sales invoices</p>
        </div>
        <Button className="gap-2" onClick={handleCreateInvoice} data-testid="button-create-invoice">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-invoices"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover-elevate" data-testid={`row-invoice-${invoice.id}`}>
                  <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                  <TableCell className="text-sm">{format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="text-sm">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="font-semibold">₹{Number(invoice.total).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-actions-${invoice.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => handleViewInvoice(invoice)} data-testid={`menu-view-${invoice.id}`}>
                          <Eye className="w-4 h-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleEditInvoice(invoice)} data-testid={`menu-edit-${invoice.id}`}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleDownloadPDF(invoice)} data-testid={`menu-download-${invoice.id}`}>
                          <Download className="w-4 h-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(invoice.id)} data-testid={`menu-delete-${invoice.id}`}>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "edit" ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "edit" ? "Update invoice details and line items" : "Create a new professional invoice with line items"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Invoice Number Display */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="text-lg font-mono font-semibold">{nextInvoiceNumber || "Loading..."}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={form.watch("status")} />
                  </div>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placeOfSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Supply *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Karnataka" data-testid="input-place-of-supply" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-invoice-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="void">Void</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", hsnCode: "", quantity: 1, rate: 0, taxRate: 18 })}
                    data-testid="button-add-line-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Item / Description *</TableHead>
                        <TableHead className="w-[120px]">HSN/SAC</TableHead>
                        <TableHead className="w-[100px]">Qty *</TableHead>
                        <TableHead className="w-[120px]">Rate *</TableHead>
                        <TableHead className="w-[100px]">Tax % *</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <div className="space-y-2">
                              <Select
                                onValueChange={(value) => handleItemSelect(index, value)}
                                value={form.watch(`lineItems.${index}.itemId`) || ""}
                              >
                                <SelectTrigger data-testid={`select-item-${index}`}>
                                  <SelectValue placeholder="Select item..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <FormField
                                  control={form.control}
                                  name={`lineItems.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input {...field} placeholder="Description" data-testid={`input-description-${index}`} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => generateAIDescription(index)}
                                  title="Generate AI description"
                                  data-testid={`button-ai-description-${index}`}
                                >
                                  <Sparkles className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.hsnCode`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input {...field} placeholder="HSN" data-testid={`input-hsn-${index}`} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => suggestAIHSN(index)}
                                title="AI suggest HSN"
                                data-testid={`button-ai-hsn-${index}`}
                              >
                                <Wand2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid={`input-quantity-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.rate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid={`input-rate-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.taxRate`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid={`input-tax-rate-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => suggestAITaxRate(index)}
                                title="AI suggest tax rate"
                                data-testid={`button-ai-tax-${index}`}
                              >
                                <Sparkles className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{calculateLineTotal(index).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-semibold">₹{totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold">₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Add any additional notes..." data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={createMutation.isPending}
                  data-testid="button-cancel-invoice"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-invoice"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {dialogMode === "edit" ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    dialogMode === "edit" ? "Update Invoice" : "Create Invoice"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View complete invoice information
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="text-lg font-mono font-semibold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Invoice Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">{getCustomerName(selectedInvoice.customerId)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Place of Supply</p>
                      <p className="font-medium">{selectedInvoice.placeOfSupply}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Dates</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Date</p>
                      <p className="font-medium">{format(new Date(selectedInvoice.invoiceDate), "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{format(new Date(selectedInvoice.dueDate), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Line Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>HSN/SAC</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Tax %</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.hsnCode || '-'}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{Number(item.rate).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{item.taxRate}%</TableCell>
                            <TableCell className="text-right font-semibold">₹{Number(item.total).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">₹{Number(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">CGST:</span>
                    <span className="font-semibold">₹{Number(selectedInvoice.cgst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">SGST:</span>
                    <span className="font-semibold">₹{Number(selectedInvoice.sgst).toFixed(2)}</span>
                  </div>
                  {Number(selectedInvoice.igst) > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">IGST:</span>
                      <span className="font-semibold">₹{Number(selectedInvoice.igst).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold">₹{Number(selectedInvoice.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Amount Due:</span>
                    <span className="font-semibold text-destructive">₹{Number(selectedInvoice.amountDue).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{selectedInvoice.notes}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} data-testid="button-close-view">
                  Close
                </Button>
                <Button onClick={() => handleDownloadPDF(selectedInvoice)} data-testid="button-download-from-view">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

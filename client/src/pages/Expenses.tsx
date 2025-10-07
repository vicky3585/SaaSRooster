import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Receipt, TrendingDown } from "lucide-react";
import { insertExpenseSchema } from "@shared/schema";

type Expense = {
  id: string;
  orgId: string;
  vendorName: string;
  vendorGstin: string | null;
  category: string | null;
  description: string;
  expenseDate: string;
  amount: string;
  taxAmount: string;
  total: string;
  billNumber: string | null;
  attachmentUrl: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
};

const EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Utilities",
  "Rent",
  "Salaries",
  "Travel",
  "Marketing",
  "Professional Fees",
  "Insurance",
  "Maintenance",
  "Miscellaneous",
];

const expenseFormSchema = insertExpenseSchema.omit({ orgId: true, createdBy: true }).extend({
  expenseDate: z.string().min(1, "Expense date is required"),
  amount: z.string().min(1, "Amount is required"),
  taxAmount: z.string().optional(),
  total: z.string().min(1, "Total is required"),
});

export default function Expenses() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const form = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      vendorName: "",
      vendorGstin: "",
      category: "",
      description: "",
      expenseDate: new Date().toISOString().split('T')[0],
      amount: "",
      taxAmount: "0",
      total: "",
      billNumber: "",
      notes: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Expense created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/expenses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDialogOpen(false);
      setEditingExpense(null);
      form.reset();
      toast({ title: "Expense updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const handleCreateExpense = (data: any) => {
    createExpenseMutation.mutate(data);
  };

  const handleUpdateExpense = (data: any) => {
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      vendorName: expense.vendorName,
      vendorGstin: expense.vendorGstin || "",
      category: expense.category || "",
      description: expense.description,
      expenseDate: expense.expenseDate.split('T')[0],
      amount: expense.amount,
      taxAmount: expense.taxAmount || "0",
      total: expense.total,
      billNumber: expense.billNumber || "",
      notes: expense.notes || "",
    });
    setDialogOpen(true);
  };

  const calculateTotal = () => {
    const amount = parseFloat(form.watch("amount") || "0");
    const taxAmount = parseFloat(form.watch("taxAmount") || "0");
    const total = (amount + taxAmount).toFixed(2);
    form.setValue("total", total);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.total || "0"), 0);

  return (
    <div className="p-6 space-y-6" data-testid="page-expenses">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Tracking</h1>
          <p className="text-muted-foreground mt-1">Track and manage your business expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingExpense(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(editingExpense ? handleUpdateExpense : handleCreateExpense)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vendorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-vendor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendorGstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor GSTIN</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={15} data-testid="input-vendor-gstin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-expense-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
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
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-expense-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="input-expense-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              calculateTotal();
                            }}
                            data-testid="input-expense-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              calculateTotal();
                            }}
                            data-testid="input-expense-tax"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} readOnly data-testid="input-expense-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-expense-bill" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="input-expense-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingExpense(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-expense"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                    data-testid="button-save-expense"
                  >
                    {editingExpense ? "Update" : "Create"} Expense
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">
                ₹{expenses
                  .filter(exp => {
                    const expDate = new Date(exp.expenseDate);
                    const now = new Date();
                    return expDate.getMonth() === now.getMonth() && 
                           expDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, exp) => sum + parseFloat(exp.total || "0"), 0)
                  .toFixed(2)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-muted-foreground">No expenses recorded yet. Add your first expense to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Bill #</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                  <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{expense.vendorName}</TableCell>
                  <TableCell>
                    {expense.category ? (
                      <Badge variant="outline">{expense.category}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell>{expense.billNumber || "-"}</TableCell>
                  <TableCell className="text-right">₹{parseFloat(expense.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{parseFloat(expense.taxAmount || "0").toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">₹{parseFloat(expense.total).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditExpense(expense)}
                        data-testid={`button-edit-expense-${expense.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete this expense?`)) {
                            deleteExpenseMutation.mutate(expense.id);
                          }
                        }}
                        data-testid={`button-delete-expense-${expense.id}`}
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
    </div>
  );
}

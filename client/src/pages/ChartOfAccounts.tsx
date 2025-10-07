import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { insertChartOfAccountsSchema } from "@shared/schema";

type ChartOfAccount = {
  id: string;
  orgId: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "revenue" | "expense" | "equity";
  parentAccountId: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const accountFormSchema = insertChartOfAccountsSchema.omit({ orgId: true });

const accountTypes = [
  { value: "asset", label: "Asset", color: "bg-blue-500" },
  { value: "liability", label: "Liability", color: "bg-red-500" },
  { value: "revenue", label: "Revenue", color: "bg-green-500" },
  { value: "expense", label: "Expense", color: "bg-orange-500" },
  { value: "equity", label: "Equity", color: "bg-purple-500" },
];

export default function ChartOfAccounts() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

  const { data: accounts = [], isLoading } = useQuery<ChartOfAccount[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  const form = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      parentAccountId: "",
      description: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/chart-of-accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Account created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create account", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/chart-of-accounts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      setDialogOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({ title: "Account updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update account", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/chart-of-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete account", variant: "destructive" });
    },
  });

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    form.reset({
      code: account.code,
      name: account.name,
      type: account.type,
      parentAccountId: account.parentAccountId || "",
      description: account.description || "",
      isActive: account.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      parentAccountId: data.parentAccountId || undefined,
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const typeInfo = accountTypes.find(t => t.value === type);
    return (
      <Badge variant="outline" className="gap-1">
        <div className={`w-2 h-2 rounded-full ${typeInfo?.color}`} />
        {typeInfo?.label}
      </Badge>
    );
  };

  const groupedAccounts = accountTypes.reduce((acc, type) => {
    acc[type.value] = accounts.filter(a => a.type === type.value);
    return acc;
  }, {} as Record<string, ChartOfAccount[]>);

  return (
    <div className="p-6 space-y-6" data-testid="page-chart-of-accounts">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your accounting structure</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingAccount(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-account">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Code *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1000" data-testid="input-account-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-account-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cash in Hand" data-testid="input-account-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-parent-account">
                            <SelectValue placeholder="None (Top Level)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None (Top Level)</SelectItem>
                          {accounts.filter(a => a.id !== editingAccount?.id).map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} value={field.value || ""} data-testid="input-account-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingAccount(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-account"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-account"
                  >
                    {editingAccount ? "Update" : "Create"} Account
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No accounts found. Add your first account to get started.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {accountTypes.map((type) => {
            const typeAccounts = groupedAccounts[type.value] || [];
            if (typeAccounts.length === 0) return null;

            return (
              <Card key={type.value} className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  {type.label} Accounts ({typeAccounts.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeAccounts.map((account) => (
                      <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{getAccountTypeBadge(account.type)}</TableCell>
                        <TableCell>
                          {account.isActive ? (
                            <Badge variant="outline" className="gap-1">
                              <Check className="w-3 h-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <X className="w-3 h-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(account)}
                              data-testid={`button-edit-account-${account.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${account.name}?`)) {
                                  deleteMutation.mutate(account.id);
                                }
                              }}
                              data-testid={`button-delete-account-${account.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

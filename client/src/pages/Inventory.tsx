import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Edit, Trash2, Package, Warehouse as WarehouseIcon, TrendingUp, AlertTriangle } from "lucide-react";
import { insertItemSchema, insertWarehouseSchema, insertStockTransactionSchema } from "@shared/schema";

type Item = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  sku: string | null;
  hsnCode: string | null;
  sacCode: string | null;
  unit: string;
  price: string;
  taxRate: string;
  stockQuantity: number;
  lowStockThreshold: number;
  defaultWarehouseId: string | null;
  isService: boolean;
  createdAt: string;
  updatedAt: string;
};

type Warehouse = {
  id: string;
  orgId: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type StockTransaction = {
  id: string;
  orgId: string;
  itemId: string;
  warehouseId: string;
  type: "purchase" | "sale" | "adjustment" | "grn";
  quantity: number;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
};

const itemFormSchema = insertItemSchema.omit({ orgId: true }).extend({
  price: z.string().min(1, "Price is required"),
  taxRate: z.string().optional(),
  stockQuantity: z.coerce.number().min(0, "Stock quantity must be 0 or more").optional(),
  lowStockThreshold: z.coerce.number().min(0).optional(),
});

const warehouseFormSchema = insertWarehouseSchema.omit({ orgId: true });

const stockTxnFormSchema = insertStockTransactionSchema.omit({ orgId: true, createdBy: true }).extend({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export default function Inventory() {
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [stockTxnDialogOpen, setStockTxnDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: stockTransactions = [], isLoading: txnsLoading } = useQuery<StockTransaction[]>({
    queryKey: ["/api/stock-transactions"],
  });

  const itemForm = useForm({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      hsnCode: "",
      sacCode: "",
      unit: "PCS",
      price: "",
      taxRate: "18.00",
      stockQuantity: 0,
      lowStockThreshold: 10,
      defaultWarehouseId: "",
      isService: false,
    },
  });

  const warehouseForm = useForm({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    },
  });

  const stockTxnForm = useForm({
    resolver: zodResolver(stockTxnFormSchema),
    defaultValues: {
      itemId: "",
      warehouseId: "",
      type: "adjustment" as const,
      quantity: 1,
      notes: "",
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setItemDialogOpen(false);
      itemForm.reset();
      toast({ title: "Item created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create item", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset();
      toast({ title: "Item updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    },
  });

  const createWarehouseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/warehouses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setWarehouseDialogOpen(false);
      warehouseForm.reset();
      toast({ title: "Warehouse created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create warehouse", variant: "destructive" });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/warehouses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setWarehouseDialogOpen(false);
      setEditingWarehouse(null);
      warehouseForm.reset();
      toast({ title: "Warehouse updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update warehouse", variant: "destructive" });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: "Warehouse deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete warehouse", variant: "destructive" });
    },
  });

  const createStockTxnMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/stock-transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setStockTxnDialogOpen(false);
      stockTxnForm.reset();
      toast({ title: "Stock transaction recorded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to record stock transaction", variant: "destructive" });
    },
  });

  const handleCreateItem = (data: any) => {
    createItemMutation.mutate(data);
  };

  const handleUpdateItem = (data: any) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    itemForm.reset({
      name: item.name,
      description: item.description || "",
      sku: item.sku || "",
      hsnCode: item.hsnCode || "",
      sacCode: item.sacCode || "",
      unit: item.unit || "PCS",
      price: item.price,
      taxRate: item.taxRate || "18.00",
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold,
      defaultWarehouseId: item.defaultWarehouseId || "",
      isService: item.isService,
    });
    setItemDialogOpen(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    warehouseForm.reset({
      name: warehouse.name,
      code: warehouse.code || "",
      address: warehouse.address || "",
      city: warehouse.city || "",
      state: warehouse.state || "",
      pincode: warehouse.pincode || "",
      isDefault: warehouse.isDefault,
    });
    setWarehouseDialogOpen(true);
  };

  const handleCreateWarehouse = (data: any) => {
    createWarehouseMutation.mutate(data);
  };

  const handleUpdateWarehouse = (data: any) => {
    if (editingWarehouse) {
      updateWarehouseMutation.mutate({ id: editingWarehouse.id, data });
    }
  };

  const handleCreateStockTxn = (data: any) => {
    createStockTxnMutation.mutate(data);
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.name || "Unknown Item";
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || "Unknown Warehouse";
  };

  // Calculate summary stats
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.stockQuantity <= item.lowStockThreshold).length;
  const totalInventoryValue = items.reduce((sum, item) => 
    sum + (parseFloat(item.price) * item.stockQuantity), 0
  );
  const totalWarehouses = warehouses.length;

  return (
    <div className="p-6 space-y-6" data-testid="page-inventory">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Manage your items, warehouses, and stock levels</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStockItems}</p>
              <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{totalInventoryValue.toLocaleString('en-IN')}</p>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-md">
              <WarehouseIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWarehouses}</p>
              <p className="text-sm text-muted-foreground">Warehouses</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" data-testid="tab-items">Items</TabsTrigger>
          <TabsTrigger value="warehouses" data-testid="tab-warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Stock Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={itemDialogOpen} onOpenChange={(open) => {
              setItemDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                itemForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(editingItem ? handleUpdateItem : handleCreateItem)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-item-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-item-sku" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={itemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} data-testid="input-item-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="hsnCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HSN Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-item-hsn" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="sacCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SAC Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-item-sac" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="PCS" data-testid="input-item-unit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} data-testid="input-item-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Rate (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} data-testid="input-item-tax-rate" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Stock Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                                data-testid="input-item-stock-quantity" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Low Stock Alert</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-item-threshold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={itemForm.control}
                      name="defaultWarehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Warehouse</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item-warehouse">
                                <SelectValue placeholder="Select warehouse" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setItemDialogOpen(false);
                          setEditingItem(null);
                          itemForm.reset();
                        }}
                        data-testid="button-cancel-item"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createItemMutation.isPending || updateItemMutation.isPending}
                        data-testid="button-save-item"
                      >
                        {editingItem ? "Update" : "Create"} Item
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-6">
            {itemsLoading ? (
              <p className="text-muted-foreground">Loading items...</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground">No items found. Add your first item to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>HSN/SAC</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku || "-"}</TableCell>
                      <TableCell>{item.hsnCode || item.sacCode || "-"}</TableCell>
                      <TableCell>₹{parseFloat(item.price).toFixed(2)}</TableCell>
                      <TableCell>{item.stockQuantity} {item.unit}</TableCell>
                      <TableCell>
                        {item.stockQuantity <= item.lowStockThreshold ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditItem(item)}
                            data-testid={`button-edit-item-${item.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                            data-testid={`button-delete-item-${item.id}`}
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
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={warehouseDialogOpen} onOpenChange={(open) => {
              setWarehouseDialogOpen(open);
              if (!open) {
                setEditingWarehouse(null);
                warehouseForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-warehouse">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
                </DialogHeader>
                <Form {...warehouseForm}>
                  <form onSubmit={warehouseForm.handleSubmit(editingWarehouse ? handleUpdateWarehouse : handleCreateWarehouse)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={warehouseForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-warehouse-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={warehouseForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-warehouse-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={warehouseForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} data-testid="input-warehouse-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={warehouseForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-warehouse-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={warehouseForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-warehouse-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={warehouseForm.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={6} data-testid="input-warehouse-pincode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setWarehouseDialogOpen(false);
                          setEditingWarehouse(null);
                          warehouseForm.reset();
                        }}
                        data-testid="button-cancel-warehouse"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                        data-testid="button-save-warehouse"
                      >
                        {editingWarehouse ? "Update" : "Create"} Warehouse
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-6">
            {warehousesLoading ? (
              <p className="text-muted-foreground">Loading warehouses...</p>
            ) : warehouses.length === 0 ? (
              <p className="text-muted-foreground">No warehouses found. Add your first warehouse to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id} data-testid={`row-warehouse-${warehouse.id}`}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>{warehouse.code || "-"}</TableCell>
                      <TableCell>
                        {warehouse.city && warehouse.state
                          ? `${warehouse.city}, ${warehouse.state}`
                          : warehouse.city || warehouse.state || "-"}
                      </TableCell>
                      <TableCell>
                        {warehouse.isDefault && <Badge>Default</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditWarehouse(warehouse)}
                            data-testid={`button-edit-warehouse-${warehouse.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${warehouse.name}?`)) {
                                deleteWarehouseMutation.mutate(warehouse.id);
                              }
                            }}
                            data-testid={`button-delete-warehouse-${warehouse.id}`}
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
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={stockTxnDialogOpen} onOpenChange={setStockTxnDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-stock-txn">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Stock Transaction</DialogTitle>
                </DialogHeader>
                <Form {...stockTxnForm}>
                  <form onSubmit={stockTxnForm.handleSubmit(handleCreateStockTxn)} className="space-y-4">
                    <FormField
                      control={stockTxnForm.control}
                      name="itemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-txn-item">
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockTxnForm.control}
                      name="warehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warehouse</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-txn-warehouse">
                                <SelectValue placeholder="Select warehouse" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockTxnForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-txn-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="purchase">Purchase</SelectItem>
                              <SelectItem value="sale">Sale</SelectItem>
                              <SelectItem value="adjustment">Adjustment</SelectItem>
                              <SelectItem value="grn">GRN</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockTxnForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-txn-quantity" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockTxnForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} data-testid="input-txn-notes" />
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
                          setStockTxnDialogOpen(false);
                          stockTxnForm.reset();
                        }}
                        data-testid="button-cancel-txn"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createStockTxnMutation.isPending}
                        data-testid="button-save-txn"
                      >
                        Record Transaction
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-6">
            {txnsLoading ? (
              <p className="text-muted-foreground">Loading transactions...</p>
            ) : stockTransactions.length === 0 ? (
              <p className="text-muted-foreground">No stock transactions found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockTransactions.map((txn) => (
                    <TableRow key={txn.id} data-testid={`row-txn-${txn.id}`}>
                      <TableCell>{new Date(txn.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getItemName(txn.itemId)}</TableCell>
                      <TableCell>{getWarehouseName(txn.warehouseId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.type}</Badge>
                      </TableCell>
                      <TableCell>{txn.quantity}</TableCell>
                      <TableCell>{txn.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

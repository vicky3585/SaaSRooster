import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";

interface PaymentGateway {
  id: string;
  gatewayName: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  mode: string;
}

interface GatewayConfig {
  id?: string;
  gatewayName: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  mode: string;
  config: Record<string, any>;
}

const GATEWAY_OPTIONS = [
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
  { value: "payumoney", label: "PayUMoney" },
  { value: "paytm", label: "Paytm" },
  { value: "ccavenue", label: "CCAvenue" },
];

const GATEWAY_FIELDS: Record<string, Array<{ key: string; label: string; type: string }>> = {
  razorpay: [
    { key: "keyId", label: "Key ID", type: "text" },
    { key: "keySecret", label: "Key Secret", type: "password" },
  ],
  stripe: [
    { key: "publishableKey", label: "Publishable Key", type: "text" },
    { key: "secretKey", label: "Secret Key", type: "password" },
  ],
  payumoney: [
    { key: "merchantKey", label: "Merchant Key", type: "text" },
    { key: "merchantSalt", label: "Merchant Salt", type: "password" },
  ],
  paytm: [
    { key: "merchantId", label: "Merchant ID", type: "text" },
    { key: "merchantKey2", label: "Merchant Key", type: "password" },
  ],
  ccavenue: [
    { key: "merchantId2", label: "Merchant ID", type: "text" },
    { key: "accessCode", label: "Access Code", type: "text" },
    { key: "workingKey", label: "Working Key", type: "password" },
  ],
};

export default function PaymentGateways() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<GatewayConfig | null>(null);
  const [formData, setFormData] = useState<GatewayConfig>({
    gatewayName: "",
    displayName: "",
    isActive: false,
    isDefault: false,
    mode: "test",
    config: {},
  });
  const { toast } = useToast();

  const { data: gateways = [], isLoading } = useQuery<PaymentGateway[]>({
    queryKey: ["/api/payment-gateways"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: GatewayConfig) => {
      await apiRequest("POST", "/api/payment-gateways", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] });
      setDialogOpen(false);
      setEditingGateway(null);
      resetForm();
      toast({
        title: "Payment gateway added",
        description: "The payment gateway has been configured successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add payment gateway",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GatewayConfig) => {
      await apiRequest("PATCH", `/api/payment-gateways/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] });
      setDialogOpen(false);
      setEditingGateway(null);
      resetForm();
      toast({
        title: "Payment gateway updated",
        description: "The payment gateway has been updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/payment-gateways/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] });
      toast({
        title: "Payment gateway deleted",
        description: "The payment gateway has been removed",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/payment-gateways/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] });
    },
  });

  const resetForm = () => {
    setFormData({
      gatewayName: "",
      displayName: "",
      isActive: false,
      isDefault: false,
      mode: "test",
      config: {},
    });
  };

  const handleOpenDialog = (gateway?: PaymentGateway) => {
    if (gateway) {
      // Load full gateway details
      apiRequest("GET", `/api/payment-gateways/${gateway.id}`).then((data: any) => {
        setEditingGateway(data);
        setFormData(data);
      });
    } else {
      resetForm();
      setEditingGateway(null);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingGateway) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleGatewayChange = (gatewayName: string) => {
    const option = GATEWAY_OPTIONS.find((o) => o.value === gatewayName);
    setFormData({
      ...formData,
      gatewayName,
      displayName: option?.label || gatewayName,
      config: {},
    });
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Payment Gateways</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure payment gateways to collect payments from customers
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-gateway">
          <Plus className="w-4 h-4 mr-2" />
          Add Gateway
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : gateways.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No payment gateways configured yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add a payment gateway to start collecting payments
          </p>
          <Button onClick={() => handleOpenDialog()} className="mt-4" data-testid="button-add-first-gateway">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Gateway
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{gateway.displayName}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={gateway.isActive ? "default" : "outline"}>
                      {gateway.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {gateway.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {gateway.mode}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(gateway)}
                    data-testid={`button-edit-${gateway.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(gateway.id)}
                    data-testid={`button-delete-${gateway.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`active-${gateway.id}`} className="text-sm">
                  Enable payments
                </Label>
                <Switch
                  id={`active-${gateway.id}`}
                  checked={gateway.isActive}
                  onCheckedChange={(checked) =>
                    toggleActiveMutation.mutate({ id: gateway.id, isActive: checked })
                  }
                  data-testid={`switch-active-${gateway.id}`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGateway ? "Edit Payment Gateway" : "Add Payment Gateway"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gateway-name">Payment Gateway</Label>
              <Select
                value={formData.gatewayName}
                onValueChange={handleGatewayChange}
                disabled={!!editingGateway}
              >
                <SelectTrigger data-testid="select-gateway-name">
                  <SelectValue placeholder="Select a gateway" />
                </SelectTrigger>
                <SelectContent>
                  {GATEWAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.gatewayName && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    data-testid="input-display-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value) => setFormData({ ...formData, mode: value })}
                  >
                    <SelectTrigger data-testid="select-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {GATEWAY_FIELDS[formData.gatewayName]?.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={formData.config[field.key] || ""}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      data-testid={`input-${field.key}`}
                    />
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-default"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: checked })
                    }
                    data-testid="switch-is-default"
                  />
                  <Label htmlFor="is-default">Set as default gateway</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="is-active">Enable this gateway</Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.gatewayName || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-gateway"
            >
              {editingGateway ? "Update" : "Add"} Gateway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

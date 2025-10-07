import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/pages/AdminPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [paymentGateway, setPaymentGateway] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
  });
  const [trialDuration, setTrialDuration] = useState("14");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const result = await adminApiRequest("GET", "/api/admin/settings");
      
      // Pre-populate form with existing settings
      if (result.settings) {
        result.settings.forEach((setting: any) => {
          if (setting.key === "razorpay_key_id") setPaymentGateway(prev => ({ ...prev, razorpayKeyId: setting.value }));
          if (setting.key === "razorpay_key_secret") setPaymentGateway(prev => ({ ...prev, razorpayKeySecret: setting.value }));
          if (setting.key === "stripe_publishable_key") setPaymentGateway(prev => ({ ...prev, stripePublishableKey: setting.value }));
          if (setting.key === "stripe_secret_key") setPaymentGateway(prev => ({ ...prev, stripeSecretKey: setting.value }));
          if (setting.key === "trial_duration_days") setTrialDuration(setting.value);
        });
      }
      
      return result;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminApiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings updated",
        description: "Platform settings have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSavePaymentSettings = () => {
    const settingsToSave = [
      { key: "razorpay_key_id", value: paymentGateway.razorpayKeyId, category: "payment" },
      { key: "razorpay_key_secret", value: paymentGateway.razorpayKeySecret, category: "payment" },
      { key: "stripe_publishable_key", value: paymentGateway.stripePublishableKey, category: "payment" },
      { key: "stripe_secret_key", value: paymentGateway.stripeSecretKey, category: "payment" },
    ];
    updateSettingsMutation.mutate({ settings: settingsToSave });
  };

  const handleSaveTrialSettings = () => {
    const settingsToSave = [
      { key: "trial_duration_days", value: trialDuration, category: "trial" },
    ];
    updateSettingsMutation.mutate({ settings: settingsToSave });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">Configure platform-wide settings</p>
      </div>

      <div className="space-y-6">
        {/* Payment Gateway Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Payment Gateway Configuration</h3>
          </div>
          
          <div className="space-y-6">
            {/* Razorpay Settings */}
            <div className="space-y-4 pb-6 border-b">
              <h4 className="font-medium">Razorpay Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                  <Input
                    id="razorpay-key-id"
                    type="text"
                    value={paymentGateway.razorpayKeyId}
                    onChange={(e) => setPaymentGateway({ ...paymentGateway, razorpayKeyId: e.target.value })}
                    placeholder="rzp_test_xxxxxxxxxxxxx"
                    data-testid="input-razorpay-key-id"
                  />
                </div>
                <div>
                  <Label htmlFor="razorpay-key-secret">Razorpay Key Secret</Label>
                  <Input
                    id="razorpay-key-secret"
                    type="password"
                    value={paymentGateway.razorpayKeySecret}
                    onChange={(e) => setPaymentGateway({ ...paymentGateway, razorpayKeySecret: e.target.value })}
                    placeholder="Enter Razorpay secret key"
                    data-testid="input-razorpay-key-secret"
                  />
                </div>
              </div>
            </div>

            {/* Stripe Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Stripe Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stripe-publishable-key">Stripe Publishable Key</Label>
                  <Input
                    id="stripe-publishable-key"
                    type="text"
                    value={paymentGateway.stripePublishableKey}
                    onChange={(e) => setPaymentGateway({ ...paymentGateway, stripePublishableKey: e.target.value })}
                    placeholder="pk_test_xxxxxxxxxxxxx"
                    data-testid="input-stripe-publishable-key"
                  />
                </div>
                <div>
                  <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    value={paymentGateway.stripeSecretKey}
                    onChange={(e) => setPaymentGateway({ ...paymentGateway, stripeSecretKey: e.target.value })}
                    placeholder="Enter Stripe secret key"
                    data-testid="input-stripe-secret-key"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSavePaymentSettings}
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-payment-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Payment Settings"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Trial Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Trial Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trial-duration">Default Trial Duration (Days)</Label>
              <Input
                id="trial-duration"
                type="number"
                value={trialDuration}
                onChange={(e) => setTrialDuration(e.target.value)}
                placeholder="14"
                min="1"
                max="90"
                className="max-w-xs"
                data-testid="input-trial-duration"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Number of days new organizations get for free trial
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveTrialSettings}
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-trial-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Trial Settings"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Display current settings summary */}
        {settings?.settings && settings.settings.length > 0 && (
          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold text-lg mb-4">Current Configuration Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.settings.map((setting: any) => (
                <div key={setting.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                  <div>
                    <p className="text-sm font-medium">{setting.key}</p>
                    <p className="text-xs text-muted-foreground">{setting.category}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded">
                    Configured
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

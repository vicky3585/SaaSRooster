import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Loader2 } from "lucide-react";

export default function SubscriptionPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    organizationId: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  const { data: plans = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/subscription-payments/plans"],
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get("orgId");
    const email = urlParams.get("email");
    const name = urlParams.get("name");
    
    if (orgId) {
      setCustomerInfo(prev => ({ ...prev, organizationId: orgId }));
    }
    if (email) {
      setCustomerInfo(prev => ({ ...prev, email }));
    }
    if (name) {
      setCustomerInfo(prev => ({ ...prev, name }));
    }
  }, []);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
  };

  const getPlanPrice = (plan: any, cycle: string) => {
    if (cycle === "monthly") return plan.monthlyPrice;
    if (cycle === "quarterly") return plan.quarterlyPrice;
    if (cycle === "annual") return plan.annualPrice;
    return 0;
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Select a plan",
        description: "Please select a subscription plan first",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!customerInfo.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!customerInfo.organizationId) {
      toast({
        title: "Missing organization",
        description: "Organization ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/subscription-payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle,
          organizationId: customerInfo.organizationId,
          customerName: customerInfo.name.trim(),
          customerEmail: customerInfo.email.trim(),
          customerPhone: customerInfo.phone.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate payment");
      }

      const data = await response.json();

      const form = formRef.current;
      if (form) {
        // Clear any existing hidden inputs
        while (form.firstChild) {
          form.removeChild(form.firstChild);
        }

        form.action = data.paymentUrl;
        
        // Create hidden inputs safely
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Submit the form - browser will navigate away
        form.submit();
      }
    } catch (error: any) {
      toast({
        title: "Payment initiation failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Subscription Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select the plan that best fits your business needs
          </p>
        </div>

        {/* Billing Cycle Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={billingCycle === "monthly" ? "default" : "outline"}
            onClick={() => setBillingCycle("monthly")}
            data-testid="button-billing-monthly"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "quarterly" ? "default" : "outline"}
            onClick={() => setBillingCycle("quarterly")}
            data-testid="button-billing-quarterly"
          >
            Quarterly
            <Badge variant="secondary" className="ml-2">Save 10%</Badge>
          </Button>
          <Button
            variant={billingCycle === "annual" ? "default" : "outline"}
            onClick={() => setBillingCycle("annual")}
            data-testid="button-billing-annual"
          >
            Annual
            <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan: any) => {
            const price = getPlanPrice(plan, billingCycle);
            const isSelected = selectedPlan?.id === plan.id;

            return (
              <Card
                key={plan.id}
                className={`p-8 cursor-pointer transition-all hover-elevate ${
                  isSelected ? "border-2 border-primary" : ""
                } ${plan.isPopular ? "shadow-lg scale-105" : ""}`}
                onClick={() => handleSelectPlan(plan)}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.isPopular && (
                  <Badge className="mb-4" data-testid={`badge-popular-${plan.id}`}>Most Popular</Badge>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹{price}</span>
                  <span className="text-muted-foreground">/{billingCycle}</span>
                </div>
                <div className="space-y-3 mb-6">
                  {(plan.features || []).map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  variant={isSelected ? "default" : "outline"}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {isSelected ? "Selected" : "Select Plan"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Customer Information Form */}
        {selectedPlan && (
          <Card className="max-w-2xl mx-auto p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Payment Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-name">Full Name</Label>
                <Input
                  id="customer-name"
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email Address</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  data-testid="input-customer-email"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone Number (Optional)</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  data-testid="input-customer-phone"
                />
              </div>
              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                  data-testid="button-proceed-payment"
                >
                  {isProcessing && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  {isProcessing ? "Processing..." : `Pay ₹${getPlanPrice(selectedPlan, billingCycle)}`}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure payment powered by PayUmoney. You'll be redirected to complete the payment.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Hidden form for PayUmoney redirect */}
        <form ref={formRef} method="POST" style={{ display: "none" }} />
      </div>
    </div>
  );
}

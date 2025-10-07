import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("orderId");
    console.log("Payment successful for order:", orderId);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription has been activated successfully. You can now start using all the features.
        </p>
        <Button
          className="w-full"
          onClick={() => setLocation("/login")}
          data-testid="button-go-to-login"
        >
          Go to Login
        </Button>
      </Card>
    </div>
  );
}

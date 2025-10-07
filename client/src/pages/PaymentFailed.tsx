import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentFailed() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("orderId");
    const reason = urlParams.get("reason");
    const status = urlParams.get("status");
    console.log("Payment failed:", { orderId, reason, status });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
        <p className="text-muted-foreground mb-6">
          Unfortunately, your payment could not be processed. Please try again or contact support if the issue persists.
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setLocation("/subscription/payment")}
            data-testid="button-retry-payment"
          >
            Try Again
          </Button>
          <Button
            className="flex-1"
            onClick={() => setLocation("/signup")}
            data-testid="button-back-to-signup"
          >
            Back to Signup
          </Button>
        </div>
      </Card>
    </div>
  );
}

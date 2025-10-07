import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/pages/AdminPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export default function AdminSubscriptionPlans() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const { toast } = useToast();

  const { data: plans = [] } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: () => adminApiRequest("GET", "/api/admin/subscription-plans"),
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthlyPrice: "",
    quarterlyPrice: "",
    annualPrice: "",
    features: [] as string[],
    isActive: true,
    isPopular: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminApiRequest("POST", "/api/admin/subscription-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Plan created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      return await adminApiRequest("PATCH", `/api/admin/subscription-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      toast({ title: "Plan updated successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      monthlyPrice: "",
      quarterlyPrice: "",
      annualPrice: "",
      features: [],
      isActive: true,
      isPopular: false,
    });
  };

  const handleSubmit = () => {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice || "",
      quarterlyPrice: plan.quarterlyPrice || "",
      annualPrice: plan.annualPrice || "",
      features: plan.features || [],
      isActive: plan.isActive,
      isPopular: plan.isPopular,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">Create and manage subscription plans</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <Card key={plan.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{plan.description}</p>
            <div className="mb-4">
              <div className="text-3xl font-bold">₹{plan.monthlyPrice}<span className="text-sm text-muted-foreground">/month</span></div>
            </div>
            <div className="space-y-2 mb-4">
              {(plan.features || []).map((feature: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {plan.isActive ? (
                <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded">Active</span>
              ) : (
                <span className="text-xs px-2 py-1 bg-gray-500/10 text-gray-500 rounded">Inactive</span>
              )}
              {plan.isPopular && (
                <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">Popular</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingPlan(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Monthly Price (₹)</Label>
                <Input type="number" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })} />
              </div>
              <div>
                <Label>Quarterly Price (₹)</Label>
                <Input type="number" value={formData.quarterlyPrice} onChange={(e) => setFormData({ ...formData, quarterlyPrice: e.target.value })} />
              </div>
              <div>
                <Label>Annual Price (₹)</Label>
                <Input type="number" value={formData.annualPrice} onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingPlan(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPlan ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

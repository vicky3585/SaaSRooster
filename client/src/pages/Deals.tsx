import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, TrendingUp, Calendar, User, DollarSign } from "lucide-react";
import { insertDealSchema } from "@shared/schema";
import { format } from "date-fns";

type Deal = {
  id: string;
  orgId: string;
  name: string;
  customerId: string | null;
  leadId: string | null;
  stage: string;
  value: string;
  probability: number;
  expectedCloseDate: string | null;
  closedDate: string | null;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  name: string;
};

type Lead = {
  id: string;
  companyName: string;
  contactName: string;
};

const dealFormSchema = insertDealSchema.omit({ orgId: true }).extend({
  value: z.string().min(1, "Deal value is required"),
  expectedCloseDate: z.string().optional(),
});

const stages = [
  { id: "prospecting", name: "Prospecting", color: "bg-slate-500" },
  { id: "qualification", name: "Qualification", color: "bg-blue-500" },
  { id: "proposal", name: "Proposal", color: "bg-purple-500" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-500" },
  { id: "closed_won", name: "Closed Won", color: "bg-green-500" },
  { id: "closed_lost", name: "Closed Lost", color: "bg-red-500" },
];

export default function Deals() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const form = useForm({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      customerId: undefined,
      leadId: undefined,
      stage: "prospecting",
      value: "",
      probability: 50,
      expectedCloseDate: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/deals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Deal created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create deal", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/deals/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setDialogOpen(false);
      setEditingDeal(null);
      form.reset();
      toast({ title: "Deal updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update deal", variant: "destructive" });
    },
  });

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    form.reset({
      name: deal.name,
      customerId: deal.customerId || undefined,
      leadId: deal.leadId || undefined,
      stage: deal.stage,
      value: deal.value,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "yyyy-MM-dd") : "",
      notes: deal.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      customerId: data.customerId || undefined,
      leadId: data.leadId || undefined,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
    };

    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getCustomerName = (customerId: string | null) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "No Customer";
  };

  const getLeadName = (leadId: string | null) => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.companyName || lead?.contactName || "No Lead";
  };

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  return (
    <div className="p-6 space-y-6" data-testid="page-deals">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage your deals through the sales stages</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingDeal(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-deal">
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDeal ? "Edit Deal" : "Add New Deal"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enterprise License Deal" data-testid="input-deal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deal-customer">
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
                    name="leadId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deal-lead">
                              <SelectValue placeholder="Select lead" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leads.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id}>
                                {lead.companyName || lead.contactName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value (₹) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-deal-value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probability (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-deal-probability" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deal-stage">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
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
                    name="expectedCloseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Close Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} data-testid="input-deal-close-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} value={field.value || ""} data-testid="input-deal-notes" />
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
                      setEditingDeal(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-deal"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-deal"
                  >
                    {editingDeal ? "Update" : "Create"} Deal
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading pipeline...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageDeals = dealsByStage[stage.id] || [];
            const totalValue = stageDeals.reduce((sum, deal) => sum + parseFloat(deal.value), 0);

            return (
              <div key={stage.id} className="flex-shrink-0 w-80" data-testid={`stage-${stage.id}`}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        {stage.name}
                      </CardTitle>
                      <Badge variant="outline">{stageDeals.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {stageDeals.map((deal) => (
                      <Card 
                        key={deal.id} 
                        className="p-3 cursor-pointer hover-elevate active-elevate-2" 
                        onClick={() => handleEdit(deal)}
                        data-testid={`deal-card-${deal.id}`}
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{deal.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span>₹{parseFloat(deal.value).toLocaleString("en-IN")}</span>
                          </div>
                          {(deal.customerId || deal.leadId) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{deal.customerId ? getCustomerName(deal.customerId) : getLeadName(deal.leadId)}</span>
                            </div>
                          )}
                          {deal.expectedCloseDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${deal.probability}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {stageDeals.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        No deals in this stage
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

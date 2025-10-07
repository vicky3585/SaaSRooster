import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, Eye, Edit, Trash2, Send, FileCheck } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";
import { format } from "date-fns";

export default function Quotations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch quotations (invoices with draft status)
  const { data: quotations = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Filter for quotations (draft invoices)
  const filteredQuotations = quotations
    .filter(q => q.status === "draft")
    .filter(q => 
      !searchQuery || 
      q.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Quotation deleted",
        description: "Quotation has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete quotation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/invoices/${id}`, {
        status: "sent",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Converted to invoice",
        description: "Quotation has been converted to an invoice successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert quotation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (quotation: Invoice) => {
    setLocation("/invoices");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvertToInvoice = (id: string) => {
    if (confirm("Convert this quotation to an invoice?")) {
      convertToInvoiceMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-quotations">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground mt-1">Manage your sales quotations</p>
        </div>
        <Button onClick={() => setLocation("/invoices")} data-testid="button-create-quotation">
          <Plus className="w-4 h-4 mr-2" />
          New Quotation
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-quotations"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quotations found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation("/invoices")}
              data-testid="button-create-first-quotation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Quotation
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id} data-testid={`row-quotation-${quotation.id}`}>
                  <TableCell className="font-medium font-mono">
                    {quotation.invoiceNumber}
                  </TableCell>
                  <TableCell>{quotation.customerId}</TableCell>
                  <TableCell>
                    {format(new Date(quotation.invoiceDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(quotation.dueDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>₹{Number(quotation.total).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <StatusBadge status={quotation.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(quotation)}
                        data-testid={`button-edit-${quotation.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleConvertToInvoice(quotation.id)}
                        data-testid={`button-convert-${quotation.id}`}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quotation.id)}
                        data-testid={`button-delete-${quotation.id}`}
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

      <div className="text-sm text-muted-foreground">
        <p>
          💡 Tip: Quotations are draft invoices. Create a quotation using "New Quotation" and convert it to an invoice when accepted.
        </p>
      </div>
    </div>
  );
}

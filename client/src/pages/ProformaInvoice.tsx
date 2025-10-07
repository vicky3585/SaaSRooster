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
import { Search, Plus, Edit, Trash2, Send, FileSpreadsheet, Download } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";
import { format } from "date-fns";

export default function ProformaInvoice() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch proforma invoices (pending status invoices)
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Filter for proforma invoices
  const filteredProformas = invoices
    .filter(q => q.status === "pending" || q.invoiceNumber.startsWith("PI-"))
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
        title: "Proforma invoice deleted",
        description: "Proforma invoice has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete proforma invoice",
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
        description: "Proforma invoice has been converted to a regular invoice successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert proforma invoice",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (proforma: Invoice) => {
    setLocation("/invoices");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this proforma invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvertToInvoice = (id: string) => {
    if (confirm("Convert this proforma invoice to a regular invoice?")) {
      convertToInvoiceMutation.mutate(id);
    }
  };

  const handleDownloadPDF = async (proforma: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${proforma.id}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proforma-${proforma.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-proforma">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proforma Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your proforma invoices</p>
        </div>
        <Button onClick={() => setLocation("/invoices")} data-testid="button-create-proforma">
          <Plus className="w-4 h-4 mr-2" />
          New Proforma Invoice
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search proforma invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-proforma"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading proforma invoices...</div>
        ) : filteredProformas.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No proforma invoices found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation("/invoices")}
              data-testid="button-create-first-proforma"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Proforma Invoice
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PI #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProformas.map((proforma) => (
                <TableRow key={proforma.id} data-testid={`row-proforma-${proforma.id}`}>
                  <TableCell className="font-medium font-mono">
                    {proforma.invoiceNumber}
                  </TableCell>
                  <TableCell>{proforma.customerId}</TableCell>
                  <TableCell>
                    {format(new Date(proforma.invoiceDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(proforma.dueDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>₹{Number(proforma.total).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <StatusBadge status={proforma.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(proforma)}
                        data-testid={`button-edit-${proforma.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadPDF(proforma)}
                        data-testid={`button-download-${proforma.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleConvertToInvoice(proforma.id)}
                        data-testid={`button-convert-${proforma.id}`}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(proforma.id)}
                        data-testid={`button-delete-${proforma.id}`}
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
          💡 Tip: Proforma invoices are preliminary invoices sent before goods/services delivery. Convert them to regular invoices when ready.
        </p>
      </div>
    </div>
  );
}

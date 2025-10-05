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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, MoreVertical, Eye, Edit, Trash2, Download } from "lucide-react";
import { useState } from "react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: string;
  status: "paid" | "overdue" | "draft" | "pending" | "partial" | "void" | "sent";
}

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");

  const invoices: Invoice[] = [
    {
      id: "1",
      invoiceNumber: "INV/24-25/000123",
      customer: "Acme Corporation",
      date: "2024-10-01",
      dueDate: "2024-10-15",
      amount: "₹1,25,000",
      status: "paid",
    },
    {
      id: "2",
      invoiceNumber: "INV/24-25/000124",
      customer: "Tech Solutions Ltd",
      date: "2024-10-03",
      dueDate: "2024-10-17",
      amount: "₹85,000",
      status: "sent",
    },
    {
      id: "3",
      invoiceNumber: "INV/24-25/000125",
      customer: "Global Enterprises",
      date: "2024-10-05",
      dueDate: "2024-10-12",
      amount: "₹2,50,000",
      status: "overdue",
    },
    {
      id: "4",
      invoiceNumber: "INV/24-25/000126",
      customer: "Innovate Systems",
      date: "2024-10-07",
      dueDate: "2024-10-21",
      amount: "₹1,50,000",
      status: "draft",
    },
    {
      id: "5",
      invoiceNumber: "INV/24-25/000127",
      customer: "Smart Solutions Inc",
      date: "2024-10-08",
      dueDate: "2024-10-22",
      amount: "₹95,000",
      status: "partial",
    },
  ];

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6" data-testid="page-invoices">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your sales invoices</p>
        </div>
        <Button className="gap-2" data-testid="button-create-invoice">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-invoices"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/50" data-testid={`row-invoice-${invoice.id}`}>
                <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell className="text-sm">{invoice.date}</TableCell>
                <TableCell className="text-sm">{invoice.dueDate}</TableCell>
                <TableCell className="font-semibold">{invoice.amount}</TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${invoice.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

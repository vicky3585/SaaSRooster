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
import { Search, Plus, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  outstanding: string;
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");

  const customers: Customer[] = [
    {
      id: "1",
      name: "Acme Corporation",
      gstin: "29ABCDE1234F1Z5",
      email: "contact@acme.com",
      phone: "+91 98765 43210",
      outstanding: "₹0",
    },
    {
      id: "2",
      name: "Tech Solutions Ltd",
      gstin: "27PQRST5678G2Y6",
      email: "info@techsolutions.com",
      phone: "+91 98765 43211",
      outstanding: "₹85,000",
    },
    {
      id: "3",
      name: "Global Enterprises",
      gstin: "33UVWXY9012H3Z7",
      email: "sales@global.com",
      phone: "+91 98765 43212",
      outstanding: "₹2,50,000",
    },
    {
      id: "4",
      name: "Innovate Systems",
      gstin: "19MNOPQ3456I4A8",
      email: "hello@innovate.com",
      phone: "+91 98765 43213",
      outstanding: "₹1,50,000",
    },
    {
      id: "5",
      name: "Smart Solutions Inc",
      gstin: "24DEFGH7890J5B9",
      email: "contact@smart.com",
      phone: "+91 98765 43214",
      outstanding: "₹45,000",
    },
  ];

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6" data-testid="page-customers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        <Button className="gap-2" data-testid="button-add-customer">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-customers"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-muted/50" data-testid={`row-customer-${customer.id}`}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="font-mono text-sm">{customer.gstin}</TableCell>
                <TableCell className="text-sm">{customer.email}</TableCell>
                <TableCell className="text-sm">{customer.phone}</TableCell>
                <TableCell className={customer.outstanding === "₹0" ? "text-muted-foreground" : "font-semibold text-destructive"}>
                  {customer.outstanding}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${customer.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
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

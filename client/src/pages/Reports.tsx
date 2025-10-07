import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Download, FileSpreadsheet, Calendar, TrendingUp, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Item, Expense } from "@shared/schema";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Filter data by date range
  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.invoiceDate);
    return invDate >= new Date(dateFrom) && invDate <= new Date(dateTo);
  });

  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate >= new Date(dateFrom) && expDate <= new Date(dateTo);
  });

  // Calculate report data
  const salesReport = {
    totalSales: filteredInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    totalInvoices: filteredInvoices.length,
    taxCollected: filteredInvoices.reduce((sum, inv) => sum + Number(inv.taxAmount || 0), 0),
    paidInvoices: filteredInvoices.filter(inv => inv.status === 'paid').length,
  };

  const taxReport = {
    cgst: filteredInvoices.reduce((sum, inv) => sum + (Number(inv.taxAmount || 0) / 2), 0),
    sgst: filteredInvoices.reduce((sum, inv) => sum + (Number(inv.taxAmount || 0) / 2), 0),
    totalTax: filteredInvoices.reduce((sum, inv) => sum + Number(inv.taxAmount || 0), 0),
  };

  const inventoryReport = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.stockQuantity), 0
    ),
    lowStockItems: items.filter(item => item.stockQuantity <= item.lowStockThreshold).length,
  };

  const expenseReport = {
    totalExpenses: filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    totalCount: filteredExpenses.length,
    avgExpense: filteredExpenses.length > 0 
      ? filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0) / filteredExpenses.length 
      : 0,
  };

  const handleExportCSV = (reportType: string) => {
    let csvContent = "";
    let filename = "";

    switch (reportType) {
      case "sales":
        csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Invoice Number,Customer,Date,Amount,Tax,Total,Status\n";
        filteredInvoices.forEach(inv => {
          csvContent += `${inv.invoiceNumber},${inv.customerId},${format(new Date(inv.invoiceDate), 'dd/MM/yyyy')},${inv.subtotal},${inv.taxAmount},${inv.total},${inv.status}\n`;
        });
        filename = `sales-report-${dateFrom}-to-${dateTo}.csv`;
        break;

      case "tax":
        csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Invoice Number,Date,Subtotal,CGST,SGST,Total Tax\n";
        filteredInvoices.forEach(inv => {
          const cgst = Number(inv.taxAmount || 0) / 2;
          const sgst = Number(inv.taxAmount || 0) / 2;
          csvContent += `${inv.invoiceNumber},${format(new Date(inv.invoiceDate), 'dd/MM/yyyy')},${inv.subtotal},${cgst.toFixed(2)},${sgst.toFixed(2)},${inv.taxAmount}\n`;
        });
        filename = `tax-report-${dateFrom}-to-${dateTo}.csv`;
        break;

      case "inventory":
        csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Item Name,SKU,Price,Stock,Value,Status\n";
        items.forEach(item => {
          const value = parseFloat(item.price) * item.stockQuantity;
          const status = item.stockQuantity <= item.lowStockThreshold ? "Low Stock" : "In Stock";
          csvContent += `${item.name},${item.sku || ""},${item.price},${item.stockQuantity},${value.toFixed(2)},${status}\n`;
        });
        filename = `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;

      case "expenses":
        csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Category,Amount,Description\n";
        filteredExpenses.forEach(exp => {
          csvContent += `${format(new Date(exp.date), 'dd/MM/yyyy')},${exp.category},${exp.amount},"${exp.description || ""}"\n`;
        });
        filename = `expense-report-${dateFrom}-to-${dateTo}.csv`;
        break;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report exported",
      description: `${filename} has been downloaded successfully`,
    });
  };

  const reports = [
    {
      id: "sales",
      title: "Sales Register",
      description: "Complete sales transactions report",
      icon: TrendingUp,
      stats: salesReport,
    },
    {
      id: "tax",
      title: "Tax Summary",
      description: "GST tax breakup and filing data",
      icon: FileText,
      stats: taxReport,
    },
    {
      id: "inventory",
      title: "Stock Valuation",
      description: "Current inventory value report",
      icon: Package,
      stats: inventoryReport,
    },
    {
      id: "expenses",
      title: "Expense Report",
      description: "Business expenses breakdown",
      icon: DollarSign,
      stats: expenseReport,
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-reports">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Generate and export financial reports</p>
      </div>

      {/* Date Range Filter */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="date-from">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="input-date-from"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="date-to">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              data-testid="input-date-to"
            />
          </div>
          <Button variant="outline" onClick={() => {
            const today = new Date();
            setDateFrom(format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'));
            setDateTo(format(today, 'yyyy-MM-dd'));
          }} data-testid="button-this-month">
            This Month
          </Button>
          <Button variant="outline" onClick={() => {
            const today = new Date();
            setDateFrom(format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd'));
            setDateTo(format(today, 'yyyy-MM-dd'));
          }} data-testid="button-this-year">
            This Year
          </Button>
        </div>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card 
              key={report.id} 
              className="p-6 hover-elevate cursor-pointer" 
              data-testid={`card-report-${report.id}`}
              onClick={() => setActiveReport(activeReport === report.id ? null : report.id)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-md">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  
                  {/* Report Stats */}
                  <div className="mt-4 space-y-2">
                    {report.id === "sales" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Sales:</span>
                          <span className="font-medium">₹{salesReport.totalSales.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Invoices:</span>
                          <span className="font-medium">{salesReport.totalInvoices}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax Collected:</span>
                          <span className="font-medium">₹{salesReport.taxCollected.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                    {report.id === "tax" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CGST:</span>
                          <span className="font-medium">₹{taxReport.cgst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">SGST:</span>
                          <span className="font-medium">₹{taxReport.sgst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Tax:</span>
                          <span className="font-medium">₹{taxReport.totalTax.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                    {report.id === "inventory" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Items:</span>
                          <span className="font-medium">{inventoryReport.totalItems}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Value:</span>
                          <span className="font-medium">₹{inventoryReport.totalValue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Low Stock:</span>
                          <Badge variant="destructive" className="h-5">{inventoryReport.lowStockItems}</Badge>
                        </div>
                      </>
                    )}
                    {report.id === "expenses" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Expenses:</span>
                          <span className="font-medium">₹{expenseReport.totalExpenses.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Count:</span>
                          <span className="font-medium">{expenseReport.totalCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Average:</span>
                          <span className="font-medium">₹{expenseReport.avgExpense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCSV(report.id);
                      }}
                      data-testid={`button-export-${report.id}`}
                    >
                      <Download className="w-3 h-3" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Report View */}
              {activeReport === report.id && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4">Report Preview</h4>
                  {report.id === "sales" && (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.slice(0, 10).map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                              <TableCell>{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell>₹{Number(inv.total).toLocaleString('en-IN')}</TableCell>
                              <TableCell>
                                <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>
                                  {inv.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {filteredInvoices.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Showing 10 of {filteredInvoices.length} invoices. Export to see all.
                        </p>
                      )}
                    </div>
                  )}
                  {report.id === "inventory" && (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.slice(0, 10).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.stockQuantity} {item.unit}</TableCell>
                              <TableCell>₹{parseFloat(item.price).toFixed(2)}</TableCell>
                              <TableCell>₹{(parseFloat(item.price) * item.stockQuantity).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

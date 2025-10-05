import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet, Calendar } from "lucide-react";

export default function Reports() {
  const reports = [
    {
      id: "gstr1",
      title: "GSTR-1",
      description: "B2B, B2C, and HSN summary for GST filing",
      icon: FileText,
    },
    {
      id: "gstr3b",
      title: "GSTR-3B",
      description: "Monthly summary for GST return filing",
      icon: FileText,
    },
    {
      id: "sales",
      title: "Sales Register",
      description: "Complete sales transactions report",
      icon: FileSpreadsheet,
    },
    {
      id: "aging",
      title: "A/R Aging",
      description: "Accounts receivable aging analysis",
      icon: Calendar,
    },
    {
      id: "tax",
      title: "Tax Summary",
      description: "Tax breakup by rate and type",
      icon: FileText,
    },
    {
      id: "inventory",
      title: "Stock Valuation",
      description: "Current inventory value report",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-reports">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and export financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="p-6 hover-elevate" data-testid={`card-report-${report.id}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-md">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="gap-2" data-testid={`button-generate-${report.id}`}>
                      <FileText className="w-3 h-3" />
                      Generate
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" data-testid={`button-export-${report.id}`}>
                      <Download className="w-3 h-3" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

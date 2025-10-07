import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Loader2 } from "lucide-react";
import { Link } from "wouter";

type Organization = {
  id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  logoUrl: string | null;
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  } | null;
  fiscalYearStart: number;
  invoicePrefix: string;
};

export default function Settings() {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<Partial<Organization>>({});

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organizations/current"],
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/organizations/current", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/current"] });
      toast({ title: "Organization settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update organization settings", variant: "destructive" });
    },
  });

  const handleSaveCompany = () => {
    const updates: any = {};
    
    if (companyData.name !== undefined) updates.name = companyData.name;
    if (companyData.gstin !== undefined) updates.gstin = companyData.gstin;
    if (companyData.pan !== undefined) updates.pan = companyData.pan;
    if (companyData.email !== undefined) updates.email = companyData.email;
    if (companyData.phone !== undefined) updates.phone = companyData.phone;
    if (companyData.website !== undefined) updates.website = companyData.website;
    if (companyData.address !== undefined) updates.address = companyData.address;
    if (companyData.invoicePrefix !== undefined) updates.invoicePrefix = companyData.invoicePrefix;
    if (companyData.fiscalYearStart !== undefined) updates.fiscalYearStart = companyData.fiscalYearStart;
    if (companyData.bankDetails !== undefined) updates.bankDetails = companyData.bankDetails;
    
    if (Object.keys(updates).length > 0) {
      updateOrgMutation.mutate(updates);
      setCompanyData({});
    }
  };

  const handleInputChange = (field: keyof Organization, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const getValue = (field: keyof Organization) => {
    if (companyData[field] !== undefined) {
      return companyData[field] as string;
    }
    return (organization?.[field] as string) || "";
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-settings">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your organization and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" data-testid="tab-company">Company</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">Company Information</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                    {organization?.logoUrl ? (
                      <img src={organization.logoUrl} alt="Company Logo" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label>Company Logo</Label>
                    <p className="text-sm text-muted-foreground mb-2">Upload your company logo (Max 2MB)</p>
                    <Button variant="outline" size="sm" className="gap-2" data-testid="button-upload-logo">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name" 
                      value={getValue("name")}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      data-testid="input-company-name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input 
                      id="gstin" 
                      value={getValue("gstin")}
                      onChange={(e) => handleInputChange("gstin", e.target.value)}
                      className="font-mono" 
                      placeholder="29ABCDE1234F1Z5"
                      data-testid="input-gstin" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN</Label>
                    <Input 
                      id="pan" 
                      value={getValue("pan")}
                      onChange={(e) => handleInputChange("pan", e.target.value)}
                      className="font-mono" 
                      placeholder="ABCDE1234F"
                      data-testid="input-pan" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={getValue("phone")}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      data-testid="input-phone" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={getValue("email")}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="contact@company.com"
                      data-testid="input-email" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      value={getValue("website")}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="www.company.com"
                      data-testid="input-website" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={getValue("address")}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    placeholder="123 Business Park, MG Road, Bangalore - 560001, Karnataka, India"
                    data-testid="input-address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank-details">Bank Details</Label>
                  <Textarea
                    id="bank-details"
                    value={
                      companyData.bankDetails !== undefined
                        ? JSON.stringify(companyData.bankDetails, null, 2)
                        : organization?.bankDetails
                        ? JSON.stringify(organization.bankDetails, null, 2)
                        : ""
                    }
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                        handleInputChange("bankDetails", parsed as any);
                      } catch {
                        handleInputChange("bankDetails", e.target.value as any);
                      }
                    }}
                    placeholder='{"bankName": "Bank Name", "accountNumber": "1234567890", "ifscCode": "ABCD0123456", "branch": "Main Branch"}'
                    rows={5}
                    data-testid="input-bank-details"
                  />
                  <p className="text-xs text-muted-foreground">Enter as JSON format</p>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveCompany}
                    disabled={updateOrgMutation.isPending || Object.keys(companyData).length === 0}
                    data-testid="button-save-company"
                  >
                    {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">User Management</h3>
            <p className="text-muted-foreground mb-4">
              Manage your team members and their roles in the organization.
            </p>
            <Link href="/staff">
              <Button data-testid="button-manage-users">Go to Staff Management</Button>
            </Link>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Billing & Subscription</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Current Plan</h4>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-medium">Professional Plan</p>
                    <p className="text-sm text-muted-foreground">Unlimited invoices and users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">₹999</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Payment Method</h4>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-update-payment">
                    Update
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Billing History</h4>
                <div className="space-y-2">
                  {[
                    { date: "Jan 1, 2024", amount: "₹999", status: "Paid" },
                    { date: "Dec 1, 2023", amount: "₹999", status: "Paid" },
                    { date: "Nov 1, 2023", amount: "₹999", status: "Paid" },
                  ].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-md" data-testid={`invoice-${i}`}>
                      <div>
                        <p className="font-medium">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">{invoice.status}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{invoice.amount}</p>
                        <Button variant="ghost" size="sm" data-testid={`button-download-invoice-${i}`}>
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" data-testid="button-cancel-subscription">Cancel Subscription</Button>
                <Button data-testid="button-upgrade-plan">Upgrade Plan</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Preferences</h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Invoice Numbering</Label>
                    <p className="text-sm text-muted-foreground">Customize your invoice number format</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={getValue("invoicePrefix")} 
                      onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                      className="w-24" 
                      placeholder="INV"
                      data-testid="input-invoice-prefix" 
                    />
                    <span className="text-muted-foreground">-0001</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fiscal Year Start</Label>
                    <p className="text-sm text-muted-foreground">Select the month your fiscal year begins</p>
                  </div>
                  <select 
                    className="px-3 py-2 border rounded-md"
                    value={
                      companyData.fiscalYearStart !== undefined
                        ? companyData.fiscalYearStart
                        : organization?.fiscalYearStart || 4
                    }
                    onChange={(e) => handleInputChange("fiscalYearStart", parseInt(e.target.value) as any)}
                    data-testid="select-fiscal-year"
                  >
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Date Format</Label>
                    <p className="text-sm text-muted-foreground">Choose how dates are displayed</p>
                  </div>
                  <select className="px-3 py-2 border rounded-md" data-testid="select-date-format">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Currency</Label>
                    <p className="text-sm text-muted-foreground">Default currency for invoices</p>
                  </div>
                  <select className="px-3 py-2 border rounded-md" data-testid="select-currency">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCompany}
                  disabled={updateOrgMutation.isPending}
                  data-testid="button-save-preferences"
                >
                  {updateOrgMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

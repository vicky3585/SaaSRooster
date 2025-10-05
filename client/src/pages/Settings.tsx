import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Upload } from "lucide-react";

export default function Settings() {
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
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <Label>Company Logo</Label>
                  <p className="text-sm text-muted-foreground mb-2">Upload your company logo (Max 2MB)</p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="Acme Corporation" data-testid="input-company-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" defaultValue="29ABCDE1234F1Z5" className="font-mono" data-testid="input-gstin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input id="pan" defaultValue="ABCDE1234F" className="font-mono" data-testid="input-pan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+91 98765 43210" data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="contact@acme.com" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="www.acme.com" data-testid="input-website" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  defaultValue="123 Business Park, MG Road, Bangalore - 560001, Karnataka, India"
                  rows={3}
                  data-testid="input-address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-details">Bank Details</Label>
                <Textarea
                  id="bank-details"
                  placeholder="Bank Name, Account Number, IFSC Code, Branch"
                  rows={3}
                  data-testid="input-bank-details"
                />
              </div>

              <div className="flex justify-end">
                <Button data-testid="button-save-company">Save Changes</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">User Management</h3>
            <p className="text-muted-foreground">User management features coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Billing & Subscription</h3>
            <p className="text-muted-foreground">Billing settings coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Preferences</h3>
            <p className="text-muted-foreground">Preference settings coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
import { Building2, Upload, Loader2, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

type OrgGstin = {
  id: string;
  orgId: string;
  gstin: string;
  type: 'regular' | 'composition' | 'sez' | 'export';
  stateCode: string;
  legalName: string;
  tradeName: string | null;
  address: string;
  isDefault: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
};

type FinancialYear = {
  id: string;
  orgId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed' | 'locked';
  isCurrent: boolean;
  createdAt: string;
};

function GstinManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingGstin, setEditingGstin] = useState<OrgGstin | null>(null);
  const [formData, setFormData] = useState({
    gstin: '',
    type: 'regular',
    stateCode: '',
    legalName: '',
    tradeName: '',
    address: '',
    validFrom: '',
    validTo: '',
  });

  const { data: gstins, isLoading } = useQuery<OrgGstin[]>({
    queryKey: ['/api/org-gstins'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/org-gstins', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/org-gstins'] });
      toast({ title: 'GSTIN added successfully' });
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to add GSTIN', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/org-gstins/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/org-gstins'] });
      toast({ title: 'GSTIN updated successfully' });
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update GSTIN', variant: 'destructive' });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/org-gstins/${id}/set-default`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/org-gstins'] });
      toast({ title: 'Default GSTIN updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/org-gstins/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/org-gstins'] });
      toast({ title: 'GSTIN deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete GSTIN', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      gstin: '',
      type: 'regular',
      stateCode: '',
      legalName: '',
      tradeName: '',
      address: '',
      validFrom: '',
      validTo: '',
    });
    setEditingGstin(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGstin) {
      updateMutation.mutate({ id: editingGstin.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (gstin: OrgGstin) => {
    setEditingGstin(gstin);
    setFormData({
      gstin: gstin.gstin,
      type: gstin.type,
      stateCode: gstin.stateCode,
      legalName: gstin.legalName,
      tradeName: gstin.tradeName || '',
      address: gstin.address,
      validFrom: gstin.validFrom || '',
      validTo: gstin.validTo || '',
    });
    setIsOpen(true);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">GSTIN Management</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage multiple GSTINs for your organization</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-gstin">
              <Plus className="w-4 h-4 mr-2" />
              Add GSTIN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingGstin ? 'Edit GSTIN' : 'Add New GSTIN'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="font-mono"
                    placeholder="29ABCDE1234F1Z5"
                    required
                    data-testid="input-gstin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger data-testid="select-gstin-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="composition">Composition</SelectItem>
                      <SelectItem value="sez">SEZ</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode">State Code *</Label>
                  <Input
                    id="stateCode"
                    value={formData.stateCode}
                    onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                    placeholder="29"
                    required
                    data-testid="input-state-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name *</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    required
                    data-testid="input-legal-name"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="tradeName">Trade Name</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    data-testid="input-trade-name"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    required
                    data-testid="input-gstin-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    data-testid="input-valid-from"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid To</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    data-testid="input-valid-to"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} data-testid="button-cancel-gstin">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-gstin">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingGstin ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {gstins && gstins.length > 0 ? (
            gstins.map((gstin) => (
              <div
                key={gstin.id}
                className="flex items-center justify-between p-4 border rounded-md"
                data-testid={`gstin-item-${gstin.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold">{gstin.gstin}</span>
                    {gstin.isDefault && (
                      <Badge variant="default" className="text-xs" data-testid="badge-default">
                        Default
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {gstin.type}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{gstin.legalName}</p>
                  {gstin.tradeName && (
                    <p className="text-sm text-muted-foreground">Trade Name: {gstin.tradeName}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{gstin.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!gstin.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(gstin.id)}
                      disabled={setDefaultMutation.isPending}
                      data-testid={`button-set-default-${gstin.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(gstin)}
                    data-testid={`button-edit-gstin-${gstin.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(gstin.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-gstin-${gstin.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No GSTINs configured. Add your first GSTIN to get started.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function FinancialYearManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingFy, setEditingFy] = useState<FinancialYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });

  const { data: financialYears, isLoading } = useQuery<FinancialYear[]>({
    queryKey: ['/api/financial-years'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/financial-years', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-years'] });
      toast({ title: 'Financial year added successfully' });
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to add financial year', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/financial-years/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-years'] });
      toast({ title: 'Financial year updated successfully' });
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update financial year', variant: 'destructive' });
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/financial-years/${id}/set-current`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-years'] });
      toast({ title: 'Current financial year updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/financial-years/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-years'] });
      toast({ title: 'Financial year deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete financial year', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      status: 'active',
    });
    setEditingFy(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFy) {
      updateMutation.mutate({ id: editingFy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (fy: FinancialYear) => {
    setEditingFy(fy);
    setFormData({
      name: fy.name,
      startDate: fy.startDate.split('T')[0],
      endDate: fy.endDate.split('T')[0],
      status: fy.status,
    });
    setIsOpen(true);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Financial Year Management</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage financial years and periods</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-fy">
              <Plus className="w-4 h-4 mr-2" />
              Add Financial Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFy ? 'Edit Financial Year' : 'Add New Financial Year'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fy-name">Name *</Label>
                <Input
                  id="fy-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="2024-25"
                  required
                  data-testid="input-fy-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="select-fy-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} data-testid="button-cancel-fy">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-fy">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingFy ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {financialYears && financialYears.length > 0 ? (
            financialYears.map((fy) => (
              <div
                key={fy.id}
                className="flex items-center justify-between p-4 border rounded-md"
                data-testid={`fy-item-${fy.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{fy.name}</span>
                    {fy.isCurrent && (
                      <Badge variant="default" className="text-xs" data-testid="badge-current">
                        Current
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {fy.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(fy.startDate).toLocaleDateString()} - {new Date(fy.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!fy.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMutation.mutate(fy.id)}
                      disabled={setCurrentMutation.isPending}
                      data-testid={`button-set-current-${fy.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Set Current
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(fy)}
                    data-testid={`button-edit-fy-${fy.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(fy.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-fy-${fy.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No financial years configured. Add your first financial year to get started.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

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
          <TabsTrigger value="gstin" data-testid="tab-gstin">GSTIN</TabsTrigger>
          <TabsTrigger value="financial-years" data-testid="tab-financial-years">Financial Years</TabsTrigger>
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

        <TabsContent value="gstin" className="space-y-6">
          <GstinManagement />
        </TabsContent>

        <TabsContent value="financial-years" className="space-y-6">
          <FinancialYearManagement />
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

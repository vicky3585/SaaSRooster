import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Building2, Shield, Users, LogOut, Loader2 } from "lucide-react";

// Admin API request helper
async function adminApiRequest(method: string, url: string, data?: any) {
  const adminToken = localStorage.getItem("adminAccessToken");
  
  if (!adminToken) {
    throw new Error("Admin authentication required");
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("adminAccessToken");
      window.location.href = "/admin/login";
      throw new Error("Admin session expired");
    }
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

type Organization = {
  id: string;
  name: string;
  gstin: string | null;
  createdAt: string;
  memberCount?: number;
};

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminAccessToken");
    if (!adminToken) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  // Fetch all organizations
  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => adminApiRequest("GET", "/api/admin/organizations"),
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await adminApiRequest("DELETE", `/api/admin/organizations/${orgId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setDeleteDialogOpen(false);
      setSelectedOrg(null);
      toast({
        title: "Organization deleted",
        description: "The organization has been removed from the system",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete organization",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredOrgs = organizations.filter(
    (org) =>
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.gstin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteOrg = (org: Organization) => {
    setSelectedOrg(org);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedOrg) {
      deleteOrgMutation.mutate(selectedOrg.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAccessToken");
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
    setLocation("/admin/login");
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-admin-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-md">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Platform Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage all organizations and system settings
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          data-testid="button-admin-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{organizations.length}</p>
              <p className="text-sm text-muted-foreground">Total Organizations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {organizations.reduce((sum, org) => sum + (org.memberCount || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">Active</p>
              <p className="text-sm text-muted-foreground">System Status</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations" data-testid="tab-organizations">
            Organizations
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-organizations"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading organizations...
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No organizations found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization Name</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id} data-testid={`row-org-${org.id}`}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        {org.gstin ? (
                          <span className="font-mono text-sm">{org.gstin}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{org.memberCount || 0}</TableCell>
                      <TableCell>
                        {new Date(org.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOrg(org)}
                          data-testid={`button-delete-${org.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Dashboard Quick Actions</p>
                  <p className="text-sm text-muted-foreground">
                    Manage which quick actions appear on the dashboard
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Module Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    Control which modules are visible to organizations
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Email Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Configure system-wide email templates and settings
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">{selectedOrg.name}</span>?
                This action cannot be undone and will remove all associated data.
              </p>

              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm font-medium text-destructive">Warning:</p>
                <ul className="text-sm text-destructive/80 list-disc list-inside mt-2">
                  <li>All users in this organization will lose access</li>
                  <li>All invoices, customers, and data will be deleted</li>
                  <li>This action is permanent and irreversible</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedOrg(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteOrgMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteOrgMutation.isPending ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

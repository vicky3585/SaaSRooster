import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/pages/AdminPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Trash2, Ban, CheckCircle, Users2, KeyRound } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AdminOrganizations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => adminApiRequest("GET", "/api/admin/organizations"),
  });

  const { data: orgUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/organizations", selectedOrg?.id, "users"],
    queryFn: () => adminApiRequest("GET", `/api/admin/organizations/${selectedOrg?.id}/users`),
    enabled: !!selectedOrg?.id,
  });

  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
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
        description: "The organization has been soft-deleted successfully",
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

  const disableOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await adminApiRequest("POST", `/api/admin/organizations/${orgId}/disable`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Organization disabled",
        description: "The organization has been disabled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disable organization",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const enableOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await adminApiRequest("POST", `/api/admin/organizations/${orgId}/enable`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Organization enabled",
        description: "The organization has been enabled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enable organization",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      await adminApiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrg?.id, "users"] });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      resetPasswordForm.reset();
      toast({
        title: "Password reset",
        description: "User password has been reset successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset password",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleViewUsers = (org: any) => {
    setSelectedOrg(org);
    setUsersDialogOpen(true);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    resetPasswordForm.reset();
    setResetPasswordDialogOpen(true);
  };

  const onResetPasswordSubmit = (data: any) => {
    if (selectedUser) {
      resetPasswordMutation.mutate({ userId: selectedUser.userId, newPassword: data.newPassword });
    }
  };

  const filteredOrgs = organizations.filter(
    (org: any) =>
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.gstin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubscriptionBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      canceled: "outline",
      expired: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: "default", label: "Active" },
      disabled: { variant: "secondary", label: "Disabled" },
      deleted: { variant: "destructive", label: "Deleted" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-muted-foreground mt-2">
          Manage all organizations on the platform
        </p>
      </div>

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
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No organizations found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org: any) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    {org.gstin ? <span className="font-mono text-sm">{org.gstin}</span> : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(org.status)}</TableCell>
                  <TableCell>{org.memberCount || 0}</TableCell>
                  <TableCell>{getSubscriptionBadge(org.subscriptionStatus)}</TableCell>
                  <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewUsers(org)}
                        data-testid={`button-view-users-${org.id}`}
                      >
                        <Users2 className="w-4 h-4 mr-1" />
                        Users
                      </Button>
                      {org.status === "active" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => disableOrgMutation.mutate(org.id)}
                            data-testid={`button-disable-org-${org.id}`}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Disable
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedOrg(org); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-org-${org.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                            Delete
                          </Button>
                        </>
                      )}
                      {org.status === "disabled" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => enableOrgMutation.mutate(org.id)}
                            data-testid={`button-enable-org-${org.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                            Enable
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedOrg(org); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-org-${org.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                            Delete
                          </Button>
                        </>
                      )}
                      {org.status === "deleted" && (
                        <Badge variant="outline" className="text-muted-foreground">No actions</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold">{selectedOrg.name}</span>?
              </p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">This will:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Prevent all users from logging in</li>
                  <li>Mark the organization as deleted</li>
                  <li>Allow the email to sign up again with a new trial</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedOrg && deleteOrgMutation.mutate(selectedOrg.id)}
              data-testid="button-confirm-delete-org"
            >
              {deleteOrgMutation.isPending ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={usersDialogOpen} onOpenChange={(open) => {
        setUsersDialogOpen(open);
        if (!open) {
          setSelectedOrg(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg?.name} - Users
            </DialogTitle>
          </DialogHeader>
          {usersLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading users...</div>
          ) : orgUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.userAvatarUrl || undefined} />
                          <AvatarFallback>
                            {user.userName?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(user)}
                        data-testid={`button-reset-password-${user.userId}`}
                      >
                        <KeyRound className="w-4 h-4 mr-1" />
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) {
          setSelectedUser(null);
          resetPasswordForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Form {...resetPasswordForm}>
              <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.userAvatarUrl || undefined} />
                    <AvatarFallback>
                      {selectedUser.userName?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.userEmail}</p>
                  </div>
                </div>

                <FormField
                  control={resetPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter new password" data-testid="input-admin-new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Confirm new password" data-testid="input-admin-confirm-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetPasswordDialogOpen(false);
                      setSelectedUser(null);
                      resetPasswordForm.reset();
                    }}
                    data-testid="button-cancel-admin-password-reset"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-confirm-admin-password-reset"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

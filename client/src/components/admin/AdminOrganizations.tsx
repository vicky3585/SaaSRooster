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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Trash2, Ban, CheckCircle, Users2, KeyRound, CreditCard, CalendarIcon, Clock, Plus, Edit } from "lucide-react";
import { format } from "date-fns";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const changePlanSchema = z.object({
  planId: z.enum(["free", "basic", "pro", "enterprise"]),
});

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Valid email is required"),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  planId: z.enum(["free", "basic", "pro", "enterprise"]),
  trialDays: z.number().min(0, "Trial days must be positive"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerEmail: z.string().email("Valid owner email is required"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const editOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Valid email is required"),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export default function AdminOrganizations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [extendValidityDialogOpen, setExtendValidityDialogOpen] = useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [editOrgDialogOpen, setEditOrgDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
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

  const changePlanForm = useForm({
    resolver: zodResolver(changePlanSchema),
    defaultValues: {
      planId: "free" as const,
    },
  });

  const createOrgForm = useForm({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      email: "",
      gstin: "",
      pan: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      planId: "free" as const,
      trialDays: 30,
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
    },
  });

  const editOrgForm = useForm({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: "",
      email: "",
      gstin: "",
      pan: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
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

  const changePlanMutation = useMutation({
    mutationFn: async ({ orgId, planId }: { orgId: string; planId: string }) => {
      await adminApiRequest("PATCH", `/api/admin/organizations/${orgId}/plan`, { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setChangePlanDialogOpen(false);
      setSelectedOrg(null);
      changePlanForm.reset();
      toast({
        title: "Plan changed",
        description: "Organization subscription plan has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change plan",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const extendValidityMutation = useMutation({
    mutationFn: async ({ orgId, trialEndsAt }: { orgId: string; trialEndsAt: string }) => {
      await adminApiRequest("PATCH", `/api/admin/organizations/${orgId}/validity`, { trialEndsAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setExtendValidityDialogOpen(false);
      setSelectedOrg(null);
      setSelectedDate(undefined);
      toast({
        title: "Validity extended",
        description: "Organization subscription validity has been extended successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to extend validity",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminApiRequest("POST", "/api/admin/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setCreateOrgDialogOpen(false);
      createOrgForm.reset();
      toast({
        title: "Organization created",
        description: "New organization has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create organization",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const editOrgMutation = useMutation({
    mutationFn: async ({ orgId, data }: { orgId: string; data: any }) => {
      return await adminApiRequest("PUT", `/api/admin/organizations/${orgId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setEditOrgDialogOpen(false);
      setSelectedOrg(null);
      editOrgForm.reset();
      toast({
        title: "Organization updated",
        description: "Organization details have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update organization",
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

  const handleChangePlan = (org: any) => {
    setSelectedOrg(org);
    changePlanForm.setValue("planId", org.planId || "free");
    setChangePlanDialogOpen(true);
  };

  const handleExtendValidity = (org: any) => {
    setSelectedOrg(org);
    setSelectedDate(org.trialEndsAt ? new Date(org.trialEndsAt) : new Date());
    setExtendValidityDialogOpen(true);
  };

  const handleEditOrg = (org: any) => {
    setSelectedOrg(org);
    editOrgForm.reset({
      name: org.name || "",
      email: org.email || "",
      gstin: org.gstin || "",
      pan: org.pan || "",
      phone: org.phone || "",
      address: org.address || "",
      city: org.city || "",
      state: org.state || "",
      pincode: org.pincode || "",
    });
    setEditOrgDialogOpen(true);
  };

  const onResetPasswordSubmit = (data: any) => {
    if (selectedUser) {
      resetPasswordMutation.mutate({ userId: selectedUser.userId, newPassword: data.newPassword });
    }
  };

  const onChangePlanSubmit = (data: any) => {
    if (selectedOrg) {
      changePlanMutation.mutate({ orgId: selectedOrg.id, planId: data.planId });
    }
  };

  const onExtendValiditySubmit = () => {
    if (selectedOrg && selectedDate) {
      const isoDate = selectedDate.toISOString();
      extendValidityMutation.mutate({ orgId: selectedOrg.id, trialEndsAt: isoDate });
    }
  };

  const onCreateOrgSubmit = (data: any) => {
    createOrgMutation.mutate(data);
  };

  const onEditOrgSubmit = (data: any) => {
    if (selectedOrg) {
      editOrgMutation.mutate({ orgId: selectedOrg.id, data });
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

  const getPlanBadge = (planId: string) => {
    const planConfig: Record<string, { variant: any; label: string }> = {
      free: { variant: "outline", label: "Free" },
      basic: { variant: "secondary", label: "Basic" },
      pro: { variant: "default", label: "Pro" },
      enterprise: { variant: "default", label: "Enterprise" },
    };
    const config = planConfig[planId] || { variant: "outline", label: planId };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatExpiryDate = (date: string | null) => {
    if (!date) return "N/A";
    const expiryDate = new Date(date);
    const now = new Date();
    const isExpired = expiryDate < now;
    return (
      <span className={isExpired ? "text-destructive font-medium" : ""}>
        {format(expiryDate, "MMM dd, yyyy")}
      </span>
    );
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
          <Button 
            onClick={() => {
              createOrgForm.reset();
              setCreateOrgDialogOpen(true);
            }}
            data-testid="button-create-organization"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Organization
          </Button>
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
                <TableHead>Plan</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Members</TableHead>
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
                  <TableCell>{getPlanBadge(org.planId)}</TableCell>
                  <TableCell>{getSubscriptionBadge(org.subscriptionStatus)}</TableCell>
                  <TableCell>{formatExpiryDate(org.trialEndsAt)}</TableCell>
                  <TableCell>{org.memberCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
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
                            onClick={() => handleEditOrg(org)}
                            data-testid={`button-edit-org-${org.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleChangePlan(org)}
                            data-testid={`button-change-plan-${org.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Change Plan
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleExtendValidity(org)}
                            data-testid={`button-extend-validity-${org.id}`}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Extend Validity
                          </Button>
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

      {/* Change Plan Dialog */}
      <Dialog open={changePlanDialogOpen} onOpenChange={(open) => {
        setChangePlanDialogOpen(open);
        if (!open) {
          setSelectedOrg(null);
          changePlanForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Change the subscription plan for this organization
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <Form {...changePlanForm}>
              <form onSubmit={changePlanForm.handleSubmit(onChangePlanSubmit)} className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedOrg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Plan: {getPlanBadge(selectedOrg.planId)}
                  </p>
                </div>

                <FormField
                  control={changePlanForm.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-new-plan">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setChangePlanDialogOpen(false);
                      setSelectedOrg(null);
                      changePlanForm.reset();
                    }}
                    data-testid="button-cancel-change-plan"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={changePlanMutation.isPending}
                    data-testid="button-confirm-change-plan"
                  >
                    {changePlanMutation.isPending ? "Updating..." : "Change Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Validity Dialog */}
      <Dialog open={extendValidityDialogOpen} onOpenChange={(open) => {
        setExtendValidityDialogOpen(open);
        if (!open) {
          setSelectedOrg(null);
          setSelectedDate(undefined);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription Validity</DialogTitle>
            <DialogDescription>
              Set a new expiry date for this organization's subscription
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedOrg.name}</p>
                <p className="text-sm text-muted-foreground">
                  Current Expiry: {formatExpiryDate(selectedOrg.trialEndsAt)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Expiry Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-select-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setExtendValidityDialogOpen(false);
                    setSelectedOrg(null);
                    setSelectedDate(undefined);
                  }}
                  data-testid="button-cancel-extend-validity"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onExtendValiditySubmit}
                  disabled={extendValidityMutation.isPending || !selectedDate}
                  data-testid="button-confirm-extend-validity"
                >
                  {extendValidityMutation.isPending ? "Extending..." : "Extend Validity"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Organization Dialog */}
      <Dialog open={createOrgDialogOpen} onOpenChange={(open) => {
        setCreateOrgDialogOpen(open);
        if (!open) {
          createOrgForm.reset();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization with an owner account
            </DialogDescription>
          </DialogHeader>
          <Form {...createOrgForm}>
            <form onSubmit={createOrgForm.handleSubmit(onCreateOrgSubmit)} className="space-y-6">
              {/* Organization Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Organization Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Acme Corp" data-testid="input-create-org-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contact@acme.com" data-testid="input-create-org-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="22AAAAA0000A1Z5" data-testid="input-create-org-gstin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="pan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AAAAA0000A" data-testid="input-create-org-pan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 98765 43210" data-testid="input-create-org-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mumbai" data-testid="input-create-org-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Maharashtra" data-testid="input-create-org-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="400001" data-testid="input-create-org-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createOrgForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main Street" data-testid="input-create-org-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Subscription Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Subscription Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-org-plan">
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="trialDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Days *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="30" 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-create-org-trial-days"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Owner Account Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Owner Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" data-testid="input-create-org-owner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="john@acme.com" data-testid="input-create-org-owner-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createOrgForm.control}
                  name="ownerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Password *</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Minimum 6 characters" data-testid="input-create-org-owner-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateOrgDialogOpen(false);
                    createOrgForm.reset();
                  }}
                  data-testid="button-cancel-create-org"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  data-testid="button-confirm-create-org"
                >
                  {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={editOrgDialogOpen} onOpenChange={(open) => {
        setEditOrgDialogOpen(open);
        if (!open) {
          setSelectedOrg(null);
          editOrgForm.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <Form {...editOrgForm}>
              <form onSubmit={editOrgForm.handleSubmit(onEditOrgSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editOrgForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Acme Corp" data-testid="input-edit-org-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editOrgForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contact@acme.com" data-testid="input-edit-org-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editOrgForm.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="22AAAAA0000A1Z5" data-testid="input-edit-org-gstin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editOrgForm.control}
                    name="pan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AAAAA0000A" data-testid="input-edit-org-pan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editOrgForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 98765 43210" data-testid="input-edit-org-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editOrgForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mumbai" data-testid="input-edit-org-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editOrgForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Maharashtra" data-testid="input-edit-org-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editOrgForm.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="400001" data-testid="input-edit-org-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editOrgForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main Street" data-testid="input-edit-org-address" />
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
                      setEditOrgDialogOpen(false);
                      setSelectedOrg(null);
                      editOrgForm.reset();
                    }}
                    data-testid="button-cancel-edit-org"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editOrgMutation.isPending}
                    data-testid="button-confirm-edit-org"
                  >
                    {editOrgMutation.isPending ? "Updating..." : "Update Organization"}
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

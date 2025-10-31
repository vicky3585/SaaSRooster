import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/pages/AdminPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  Trash2, 
  Ban, 
  CheckCircle, 
  Users2, 
  KeyRound, 
  Edit, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  Plus,
  UserPlus,
  Shield
} from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const editOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().length(6, "PIN code must be 6 digits").optional().or(z.literal("")),
  gstin: z.string().length(15, "GSTIN must be 15 characters").optional().or(z.literal("")),
});

const changePlanSchema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
});

const extendValiditySchema = z.object({
  expiryDate: z.string().min(1, "Expiry date is required"),
});

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().length(6, "PIN code must be 6 digits").optional().or(z.literal("")),
  gstin: z.string().length(15, "GSTIN must be 15 characters").optional().or(z.literal("")),
  pan: z.string().length(10, "PAN must be 10 characters").optional().or(z.literal("")),
  planId: z.enum(["starter", "professional", "enterprise"]),
  validityDays: z.number().int().min(1),
});

const createUserSchema = z.object({
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "admin", "staff"]),
  phone: z.string().optional(),
});

const editUserSchema = z.object({
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const changeRoleSchema = z.object({
  role: z.enum(["owner", "admin", "staff"]),
});

export default function AdminOrganizations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [extendValidityDialogOpen, setExtendValidityDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => adminApiRequest("GET", "/api/admin/organizations"),
  });

  const { data: orgUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
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

  const editOrgForm = useForm({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
    },
  });

  const changePlanForm = useForm({
    resolver: zodResolver(changePlanSchema),
    defaultValues: {
      planId: "starter" as "starter" | "professional" | "enterprise",
    },
  });

  const extendValidityForm = useForm({
    resolver: zodResolver(extendValiditySchema),
    defaultValues: {
      expiryDate: "",
    },
  });

  const createOrgForm = useForm({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      ownerEmail: "",
      ownerName: "",
      ownerPassword: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      pan: "",
      planId: "starter" as "starter" | "professional" | "enterprise",
      validityDays: 30,
    },
  });

  const createUserForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "staff" as "owner" | "admin" | "staff",
      phone: "",
    },
  });

  const editUserForm = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const changeRoleForm = useForm({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      role: "staff" as "owner" | "admin" | "staff",
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

  const updateOrgMutation = useMutation({
    mutationFn: async ({ orgId, data }: { orgId: string; data: any }) => {
      await adminApiRequest("PATCH", `/api/admin/organizations/${orgId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setEditDialogOpen(false);
      setSelectedOrg(null);
      editOrgForm.reset();
      toast({
        title: "Organization updated",
        description: "The organization details have been updated successfully",
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

  const changePlanMutation = useMutation({
    mutationFn: async ({ orgId, planId }: { orgId: string; planId: string }) => {
      await adminApiRequest("POST", `/api/admin/organizations/${orgId}/change-plan`, { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setChangePlanDialogOpen(false);
      setSelectedOrg(null);
      changePlanForm.reset();
      toast({
        title: "Plan changed",
        description: "The subscription plan has been changed successfully",
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
    mutationFn: async ({ orgId, expiryDate }: { orgId: string; expiryDate: string }) => {
      await adminApiRequest("POST", `/api/admin/organizations/${orgId}/extend-validity`, { expiryDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setExtendValidityDialogOpen(false);
      setSelectedOrg(null);
      extendValidityForm.reset();
      toast({
        title: "Validity extended",
        description: "The subscription validity has been extended successfully",
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

  const deleteUserMutation = useMutation({
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      await adminApiRequest("DELETE", `/api/admin/organizations/${orgId}/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrg?.id, "users"] });
      refetchUsers();
      setDeleteUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User deleted",
        description: "The user has been removed from the organization successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      await adminApiRequest("POST", "/api/admin/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setCreateOrgDialogOpen(false);
      createOrgForm.reset();
      toast({
        title: "Organization created",
        description: "The organization has been created successfully",
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

  const createUserMutation = useMutation({
    mutationFn: async ({ orgId, data }: { orgId: string; data: any }) => {
      await adminApiRequest("POST", `/api/admin/organizations/${orgId}/users`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrg?.id, "users"] });
      refetchUsers();
      setCreateUserDialogOpen(false);
      createUserForm.reset();
      toast({
        title: "User created",
        description: "The user has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create user",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      await adminApiRequest("PATCH", `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrg?.id, "users"] });
      refetchUsers();
      setEditUserDialogOpen(false);
      setSelectedUser(null);
      editUserForm.reset();
      toast({
        title: "User updated",
        description: "The user details have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ orgId, userId, role }: { orgId: string; userId: string; role: string }) => {
      await adminApiRequest("PATCH", `/api/admin/organizations/${orgId}/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrg?.id, "users"] });
      refetchUsers();
      setChangeRoleDialogOpen(false);
      setSelectedUser(null);
      changeRoleForm.reset();
      toast({
        title: "Role changed",
        description: "The user's role has been changed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change role",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleViewUsers = (org: any) => {
    setSelectedOrg(org);
    setUsersDialogOpen(true);
  };

  const handleEditOrg = (org: any) => {
    setSelectedOrg(org);
    editOrgForm.reset({
      name: org.name || "",
      email: org.email || "",
      phone: org.phone || "",
      address: org.address || "",
      city: org.city || "",
      state: org.state || "",
      pincode: org.pincode || "",
      gstin: org.gstin || "",
    });
    setEditDialogOpen(true);
  };

  const handleChangePlan = (org: any) => {
    setSelectedOrg(org);
    changePlanForm.reset({
      planId: org.planId || "starter",
    });
    setChangePlanDialogOpen(true);
  };

  const handleExtendValidity = (org: any) => {
    setSelectedOrg(org);
    const currentExpiry = org.subscriptionExpiresAt 
      ? new Date(org.subscriptionExpiresAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    extendValidityForm.reset({
      expiryDate: currentExpiry,
    });
    setExtendValidityDialogOpen(true);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    resetPasswordForm.reset();
    setResetPasswordDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleCreateUser = () => {
    if (selectedOrg) {
      createUserForm.reset();
      setCreateUserDialogOpen(true);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.userName || "",
      email: user.userEmail || "",
      phone: user.userPhone || "",
    });
    setEditUserDialogOpen(true);
  };

  const handleChangeRole = (user: any) => {
    setSelectedUser(user);
    changeRoleForm.reset({
      role: user.role || "staff",
    });
    setChangeRoleDialogOpen(true);
  };

  const onResetPasswordSubmit = (data: any) => {
    if (selectedUser) {
      resetPasswordMutation.mutate({ userId: selectedUser.userId, newPassword: data.newPassword });
    }
  };

  const onCreateOrgSubmit = (data: any) => {
    const cleanData = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      gstin: data.gstin || null,
      pan: data.pan || null,
    };
    createOrgMutation.mutate(cleanData);
  };

  const onCreateUserSubmit = (data: any) => {
    if (selectedOrg) {
      const cleanData = {
        ...data,
        phone: data.phone || null,
      };
      createUserMutation.mutate({ orgId: selectedOrg.id, data: cleanData });
    }
  };

  const onEditUserSubmit = (data: any) => {
    if (selectedUser) {
      const cleanData = {
        ...data,
        phone: data.phone || null,
      };
      editUserMutation.mutate({ userId: selectedUser.userId, data: cleanData });
    }
  };

  const onChangeRoleSubmit = (data: any) => {
    if (selectedUser && selectedOrg) {
      changeRoleMutation.mutate({ 
        orgId: selectedOrg.id, 
        userId: selectedUser.userId, 
        role: data.role 
      });
    }
  };

  const onEditOrgSubmit = (data: any) => {
    if (selectedOrg) {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      );
      updateOrgMutation.mutate({ orgId: selectedOrg.id, data: cleanData });
    }
  };

  const onChangePlanSubmit = (data: any) => {
    if (selectedOrg) {
      changePlanMutation.mutate({ orgId: selectedOrg.id, planId: data.planId });
    }
  };

  const onExtendValiditySubmit = (data: any) => {
    if (selectedOrg) {
      const expiryDate = new Date(data.expiryDate).toISOString();
      extendValidityMutation.mutate({ orgId: selectedOrg.id, expiryDate });
    }
  };

  const filteredOrgs = organizations.filter(
    (org: any) =>
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    const variants: Record<string, any> = {
      starter: { variant: "secondary", label: "Starter" },
      professional: { variant: "default", label: "Professional" },
      enterprise: { variant: "default", label: "Enterprise" },
    };
    const config = variants[planId] || { variant: "outline", label: planId };
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
              placeholder="Search organizations by name, email, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-organizations"
            />
          </div>
          <Button 
            onClick={() => setCreateOrgDialogOpen(true)}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{org.name}</p>
                        {org.gstin && (
                          <p className="text-xs text-muted-foreground font-mono">{org.gstin}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{org.email || "-"}</span>
                    </TableCell>
                    <TableCell>{getPlanBadge(org.planId)}</TableCell>
                    <TableCell>
                      {org.subscriptionExpiresAt ? (
                        <span className="text-sm">
                          {new Date(org.subscriptionExpiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell>{org.memberCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
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
                          Plan
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleExtendValidity(org)}
                          data-testid={`button-extend-validity-${org.id}`}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Extend
                        </Button>
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => disableOrgMutation.mutate(org.id)}
                            data-testid={`button-disable-org-${org.id}`}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Disable
                          </Button>
                        )}
                        {org.status === "disabled" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => enableOrgMutation.mutate(org.id)}
                            data-testid={`button-enable-org-${org.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                            Enable
                          </Button>
                        )}
                        {(org.status === "active" || org.status === "disabled") && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedOrg(org); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-org-${org.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Organization Dialog */}
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
                  <li>Preserve data for compliance</li>
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

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization Details</DialogTitle>
            <DialogDescription>
              Update the organization information below
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <Form {...editOrgForm}>
              <form onSubmit={editOrgForm.handleSubmit(onEditOrgSubmit)} className="space-y-4">
                <FormField
                  control={editOrgForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter organization name" data-testid="input-edit-org-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editOrgForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter email" data-testid="input-edit-org-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editOrgForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone number" data-testid="input-edit-org-phone" />
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
                        <Input {...field} placeholder="Enter address" data-testid="input-edit-org-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editOrgForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter city" data-testid="input-edit-org-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editOrgForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter state" data-testid="input-edit-org-state" />
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
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="6 digits" maxLength={6} data-testid="input-edit-org-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editOrgForm.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="15 characters" maxLength={15} data-testid="input-edit-org-gstin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    data-testid="button-cancel-edit-org"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateOrgMutation.isPending}
                    data-testid="button-confirm-edit-org"
                  >
                    {updateOrgMutation.isPending ? "Updating..." : "Update Organization"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <AlertDialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOrg && (
                <div className="space-y-4 mt-4">
                  <p>Change subscription plan for <span className="font-semibold">{selectedOrg.name}</span></p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Current Plan: {getPlanBadge(selectedOrg.planId)}</p>
                  </div>
                  <Form {...changePlanForm}>
                    <form className="space-y-4">
                      <FormField
                        control={changePlanForm.control}
                        name="planId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Plan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-new-plan">
                                  <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChangePlanDialogOpen(false)} data-testid="button-cancel-change-plan">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={changePlanForm.handleSubmit(onChangePlanSubmit)}
              disabled={changePlanMutation.isPending}
              data-testid="button-confirm-change-plan"
            >
              {changePlanMutation.isPending ? "Changing..." : "Change Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Validity Dialog */}
      <Dialog open={extendValidityDialogOpen} onOpenChange={setExtendValidityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription Validity</DialogTitle>
            <DialogDescription>
              Set a new expiry date for the organization's subscription
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <Form {...extendValidityForm}>
              <form onSubmit={extendValidityForm.handleSubmit(onExtendValiditySubmit)} className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">Organization: {selectedOrg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Expiry: {selectedOrg.subscriptionExpiresAt 
                      ? new Date(selectedOrg.subscriptionExpiresAt).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>

                <FormField
                  control={extendValidityForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Expiry Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          data-testid="input-extend-validity-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setExtendValidityDialogOpen(false)}
                    data-testid="button-cancel-extend-validity"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={extendValidityMutation.isPending}
                    data-testid="button-confirm-extend-validity"
                  >
                    {extendValidityMutation.isPending ? "Extending..." : "Extend Validity"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={usersDialogOpen} onOpenChange={(open) => {
        setUsersDialogOpen(open);
        if (!open) {
          setSelectedOrg(null);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg?.name} - Users
            </DialogTitle>
            <DialogDescription>
              Manage users belonging to this organization
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleCreateUser}
              size="sm"
              data-testid="button-create-user"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
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
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-user-${user.userId}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChangeRole(user)}
                          data-testid={`button-change-role-${user.userId}`}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          data-testid={`button-reset-password-${user.userId}`}
                        >
                          <KeyRound className="w-4 h-4 mr-1" />
                          Password
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          data-testid={`button-delete-user-${user.userId}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                          Delete
                        </Button>
                      </div>
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

      {/* Reset Password Dialog */}
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
            <DialogDescription>
              Set a new password for this user
            </DialogDescription>
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

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete User
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <div className="space-y-3 mt-4">
                  <p>
                    Are you sure you want to remove <span className="font-semibold">{selectedUser.userName}</span> ({selectedUser.userEmail}) from this organization?
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">This action will:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Remove the user's access to this organization</li>
                      <li>The user can still access other organizations they're part of</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteUserDialogOpen(false);
                setSelectedUser(null);
              }}
              data-testid="button-cancel-delete-user"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser && selectedOrg) {
                  deleteUserMutation.mutate({ orgId: selectedOrg.id, userId: selectedUser.userId });
                }
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Organization Dialog */}
      <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization with an owner account
            </DialogDescription>
          </DialogHeader>
          <Form {...createOrgForm}>
            <form onSubmit={createOrgForm.handleSubmit(onCreateOrgSubmit)} className="space-y-4">
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-sm">Owner Account Details</h3>
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
                          <Input {...field} type="email" placeholder="owner@example.com" data-testid="input-create-org-owner-email" />
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
                      <FormLabel>Initial Password *</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Minimum 6 characters" data-testid="input-create-org-owner-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-sm">Organization Details</h3>
                <FormField
                  control={createOrgForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Corporation" data-testid="input-create-org-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="info@acme.com" data-testid="input-create-org-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 1234567890" data-testid="input-create-org-phone" />
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
                        <Input {...field} placeholder="123 Main St" data-testid="input-create-org-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
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
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="400001" maxLength={6} data-testid="input-create-org-pincode" />
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
                          <Input {...field} placeholder="15 characters" maxLength={15} data-testid="input-create-org-gstin" />
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
                          <Input {...field} placeholder="10 characters" maxLength={10} data-testid="input-create-org-pan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-sm">Subscription Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOrgForm.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Plan *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-org-plan">
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createOrgForm.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validity (Days) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            placeholder="30" 
                            data-testid="input-create-org-validity" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOrgDialogOpen(false)}
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

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
              <FormField
                control={createUserForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" data-testid="input-create-user-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john@example.com" data-testid="input-create-user-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Password *</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Minimum 6 characters" data-testid="input-create-user-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createUserForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 1234567890" data-testid="input-create-user-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-create-user-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
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
                  onClick={() => setCreateUserDialogOpen(false)}
                  data-testid="button-cancel-create-user"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  data-testid="button-confirm-create-user"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update the user's information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Form {...editUserForm}>
              <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
                <FormField
                  control={editUserForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-edit-user-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@example.com" data-testid="input-edit-user-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editUserForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 1234567890" data-testid="input-edit-user-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditUserDialogOpen(false)}
                    data-testid="button-cancel-edit-user"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editUserMutation.isPending}
                    data-testid="button-confirm-edit-user"
                  >
                    {editUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the user's role in this organization
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Form {...changeRoleForm}>
              <form onSubmit={changeRoleForm.handleSubmit(onChangeRoleSubmit)} className="space-y-4">
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

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Current Role: <span className="font-semibold text-foreground">{selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}</span>
                  </p>
                </div>

                <FormField
                  control={changeRoleForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-change-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
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
                    onClick={() => setChangeRoleDialogOpen(false)}
                    data-testid="button-cancel-change-role"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={changeRoleMutation.isPending}
                    data-testid="button-confirm-change-role"
                  >
                    {changeRoleMutation.isPending ? "Changing..." : "Change Role"}
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

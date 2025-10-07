import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Users, Crown, Shield, Eye, Calculator } from "lucide-react";

type Membership = {
  id: string;
  userId: string;
  orgId: string;
  role: "owner" | "admin" | "accountant" | "viewer";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

const inviteFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "accountant", "viewer"]),
});

const updateRoleFormSchema = z.object({
  role: z.enum(["admin", "accountant", "viewer"]),
});

const getRoleIcon = (role: string) => {
  switch (role) {
    case "owner":
      return <Crown className="w-4 h-4" />;
    case "admin":
      return <Shield className="w-4 h-4" />;
    case "accountant":
      return <Calculator className="w-4 h-4" />;
    case "viewer":
      return <Eye className="w-4 h-4" />;
    default:
      return null;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "owner":
      return "default" as const;
    case "admin":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

export default function Staff() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [updateRoleDialogOpen, setUpdateRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);

  const { data: members = [], isLoading } = useQuery<Membership[]>({
    queryKey: ["/api/memberships"],
  });

  const inviteForm = useForm({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "viewer" as const,
    },
  });

  const updateRoleForm = useForm({
    resolver: zodResolver(updateRoleFormSchema),
    defaultValues: {
      role: "viewer" as const,
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/memberships/invite", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      setInviteDialogOpen(false);
      inviteForm.reset();
      toast({ title: "Team member invited successfully" });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to invite team member";
      toast({ title: message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/memberships/${id}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      setUpdateRoleDialogOpen(false);
      setSelectedMember(null);
      updateRoleForm.reset();
      toast({ title: "Role updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/memberships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Team member removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove team member", variant: "destructive" });
    },
  });

  const handleInvite = (data: any) => {
    inviteMutation.mutate(data);
  };

  const handleUpdateRole = (data: any) => {
    if (selectedMember) {
      updateRoleMutation.mutate({ id: selectedMember.id, role: data.role });
    }
  };

  const handleEditRole = (member: Membership) => {
    setSelectedMember(member);
    updateRoleForm.reset({ role: member.role as any });
    setUpdateRoleDialogOpen(true);
  };

  const currentUserMembership = members.find(m => m.user?.id === user?.id);
  const canManageMembers = currentUserMembership?.role === "owner" || currentUserMembership?.role === "admin";

  return (
    <div className="p-6 space-y-6" data-testid="page-staff">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their roles</p>
        </div>
        {canManageMembers && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-member">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="user@example.com" data-testid="input-invite-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-invite-role">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="accountant">Accountant</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Role Permissions:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Admin:</strong> Full access to manage data and settings</li>
                      <li>• <strong>Accountant:</strong> Can manage invoices, expenses, and reports</li>
                      <li>• <strong>Viewer:</strong> Read-only access to data</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setInviteDialogOpen(false);
                        inviteForm.reset();
                      }}
                      data-testid="button-cancel-invite"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={inviteMutation.isPending}
                      data-testid="button-send-invite"
                    >
                      Send Invite
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Team Members ({members.length})</h2>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading team members...</p>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground">No team members found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {member.user?.name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.user?.name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.user?.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                  {canManageMembers && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {member.role !== "owner" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRole(member)}
                              data-testid={`button-edit-role-${member.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${member.user?.name || "this member"}?`)) {
                                  removeMemberMutation.mutate(member.id);
                                }
                              }}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={updateRoleDialogOpen} onOpenChange={setUpdateRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <Form {...updateRoleForm}>
              <form onSubmit={updateRoleForm.handleSubmit(handleUpdateRole)} className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMember.user?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {selectedMember.user?.name?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMember.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.user?.email}</p>
                  </div>
                </div>

                <FormField
                  control={updateRoleForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-update-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUpdateRoleDialogOpen(false);
                      setSelectedMember(null);
                      updateRoleForm.reset();
                    }}
                    data-testid="button-cancel-role-update"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateRoleMutation.isPending}
                    data-testid="button-save-role-update"
                  >
                    Update Role
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

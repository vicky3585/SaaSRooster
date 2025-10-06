import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrgSwitcher() {
  const { user, switchOrg, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: memberships, isLoading: membershipLoading } = useQuery<{ orgId: string; role: string; organization: Organization }[]>({
    queryKey: ['/api/users/me/memberships'],
    enabled: !!user,
  });

  const currentOrg = memberships?.find((m) => m.orgId === user?.currentOrgId)?.organization;

  const handleOrgSwitch = async (orgId: string) => {
    if (orgId === user?.currentOrgId) return;
    
    setIsLoading(true);
    try {
      await switchOrg(orgId);
      toast({
        title: 'Organization switched',
        description: 'You have successfully switched organizations',
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Failed to switch organization',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      toast({
        title: 'Logout failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  if (!user || membershipLoading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3"
          disabled={isLoading}
          data-testid="button-org-switcher"
        >
          <Building2 className="w-4 h-4" />
          <span className="max-w-[150px] truncate">{currentOrg?.name || 'Select org'}</span>
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships?.map((membership) => (
          <DropdownMenuItem
            key={membership.orgId}
            onClick={() => handleOrgSwitch(membership.orgId)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`org-option-${membership.organization.slug}`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {membership.organization.name}
            </span>
            {membership.orgId === user.currentOrgId && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive" data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

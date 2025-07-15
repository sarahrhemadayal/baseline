
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SidebarNav } from './components/sidebar-nav';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useUserProfile } from '@/lib/useUserProfile';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useUserProfile();

  if (loading) {
      return <div>Loading...</div>
  }

  const mockProfile = {
      name: 'User',
      email: 'user@example.com',
      avatar: 'https://placehold.co/100x100.png',
  }

  const displayProfile = profile || mockProfile;


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-7 w-7 text-sidebar-primary" />
              <span className="font-headline text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                Baseline
              </span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarImage src={displayProfile.avatar} alt={displayProfile.name} />
              <AvatarFallback>{(displayProfile.name).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {displayProfile.name}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {displayProfile.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 group-data-[collapsible=icon]:hidden"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

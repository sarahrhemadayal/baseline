
'use client';

import {
  MessageCircle,
  User,
  FileText,
  Linkedin,
  TrendingUp,
  Settings,
  ClipboardCheck
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  {
    href: '/dashboard/resume-builder',
    icon: FileText,
    label: 'Resume Builder',
  },
  {
    href: '/dashboard/linkedin-post',
    icon: Linkedin,
    label: 'LinkedIn Posts',
  },
  { href: '/dashboard/skills', icon: TrendingUp, label: 'Skills Analysis' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { href: '/onboarding', icon: ClipboardCheck, label: 'Onboarding' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

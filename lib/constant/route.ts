import { 
    LayoutDashboard, 
    Users, 
    MessageSquare, 
    Phone, 
    BarChart, 
    Settings 
  } from "lucide-react";
  
  export const ROUTE_CONFIG = [
    {
      key: 'dashboard',
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      requiredPermissions: ['read:dashboard']
    },
    {
      key: 'leads',
      label: "Leads",
      icon: Users,
      href: "/leads",
      requiredPermissions: ['read:leads']
    },
    {
      key: 'messages',
      label: "Messages",
      icon: MessageSquare,
      href: "/messages", 
      requiredPermissions: ['read:messages']
    },
    {
      key: 'calls',
      label: "Calls",
      icon: Phone,
      href: "/calls",
      requiredPermissions: ['read:calls']
    },
    {
      key: 'analytics',
      label: "Analytics",
      icon: BarChart,
      href: "/analytics",
      requiredPermissions: ['read:analytics']
    },
    {
      key: 'settings',
      label: "Settings",
      icon: Settings,
      href: "/settings",
      requiredPermissions: ['read:settings']
    }
  ] as const;
  
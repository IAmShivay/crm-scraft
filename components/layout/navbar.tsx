"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Leads Sources", href: "/leads-sources" },
    { name: "Leads", href: "/leads" },
    { name: "Contact", href: "/contact" },
    { name: "Analytics", href: "/analytics" },
  ];

  return (
    <>
      {/* Mobile Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden lg:hidden fixed top-0 left-0 right-0 z-50 ">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            CRM
          </Link>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Menu Button */}
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="border-b p-4">
                    <Link href="/" className="font-bold text-xl">
                      CRM
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                            pathname === item.href
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:bg-secondary/50"
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {user && (
                    <div className="border-t p-4">
                      <UserNav />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16 md:h-0" />
    </>
  );
}

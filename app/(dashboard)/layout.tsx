"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // const router = useRouter();
  // const user = useAppSelector((state) => state.auth.user);

  // useEffect(() => {
  //   if (!user) {
  //     router.push("/login");
  //   }
  // }, [user, router]);

  // if (!user) {
  //   return null;
  // }

  return (
    <div className=" min-h-screen relative">
      <div className="md:hidden lg:hidden flex h-16 items-center justify-between px-4 ">
        <Link href="/" className="font-bold text-xl">
          CRM
        </Link>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <Button
            variant="outline"
            size="icon"
            className="md:hidden lg:hidden bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {<Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      <div className="flex relative">
        {/* Overlay for Blur Effect */}
        {isOpen && (
          <div className="fixed inset-0 bg-gray-900 opacity-70 z-50" />
        )}

        <aside className="  border-r min-h-[calc(100vh-4rem)] z-[99]">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        </aside>
        <main className="flex-1 relative z-0">{children}</main>
      </div>
    </div>
  );
}

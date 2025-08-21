import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
export const Hero = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Transform Your Lead Management
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            Streamline your lead management process with our powerful CRM platform. Track, nurture, and convert leads effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in [animation-delay:400ms]">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-xl transition-all">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all">
              Watch Demo
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in [animation-delay:600ms]">
            <div className="text-center p-4 rounded-lg bg-card hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-primary">10k+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-card hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-primary">1M+</p>
              <p className="text-sm text-muted-foreground">Leads Managed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-card hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-primary">99%</p>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
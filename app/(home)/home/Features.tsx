import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Shield, Globe, Zap, LineChart } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with your team to manage leads effectively."
  },
  {
    icon: MessageSquare,
    title: "Smart Communication",
    description: "Stay in touch with leads through integrated communication tools."
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Your data is protected with enterprise-grade security measures."
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Access your leads and data from anywhere in the world."
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate repetitive tasks and focus on what matters most."
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Get insights into your lead management performance."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 bg-accent/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your leads effectively and grow your business.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
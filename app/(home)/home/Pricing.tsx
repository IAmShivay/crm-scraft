import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    features: [
      "Up to 1,000 leads",
      "Basic analytics",
      "Email support",
      "1 workspace",
      "Basic automation"
    ]
  },
  {
    name: "Professional",
    price: "$79",
    popular: true,
    features: [
      "Up to 10,000 leads",
      "Advanced analytics",
      "Priority support",
      "5 workspaces",
      "Advanced automation",
      "API access"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited leads",
      "Custom integrations",
      "24/7 support",
      "Unlimited workspaces",
      "Custom automation",
      "Dedicated account manager"
    ]
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your needs. All plans include our core features.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-4">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-lg text-gray-600">/mo</span>}
                  </div>
                  <ul className="space-y-3 mb-6 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
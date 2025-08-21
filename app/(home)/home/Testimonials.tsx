import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    quote: "LeadHive has transformed how we manage our leads. The interface is intuitive and the features are exactly what we needed.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechCorp",
    avatar: "/placeholder.svg"
  },
  {
    quote: "The team collaboration features are outstanding. We've seen a 40% increase in conversion rates since switching to LeadHive.",
    author: "Michael Chen",
    role: "Sales Manager",
    company: "GrowthCo",
    avatar: "/placeholder.svg"
  },
  {
    quote: "The automation features have saved us countless hours. It's like having an extra team member working 24/7.",
    author: "Emily Rodriguez",
    role: "Operations Lead",
    company: "ScaleUp Inc",
    avatar: "/placeholder.svg"
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-accent/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Here&apos;s what our customers have to say about LeadHive.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-lg transition-all">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">{testimonial.quote}</p>
                      <div className="flex items-center gap-4">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.author}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
import { Features } from "./Features";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";

const page = () => {
    return (
        <div className="min-h-screen">
            <Header />
            <Hero />
            <Features />
            <Pricing />
            <Testimonials />
            <Footer />
        </div>
    );
};

export default page;



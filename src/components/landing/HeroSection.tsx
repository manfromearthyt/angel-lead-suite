import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Users, Award } from "lucide-react";
import { useState } from "react";
import { LeadForm } from "./LeadForm";

export const HeroSection = () => {
  const [showLeadForm, setShowLeadForm] = useState(false);

  return (
    <section className="relative overflow-hidden hero-gradient text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Your Gateway to 
                <span className="text-accent"> Global Opportunities</span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Expert visa consultancy services to make your dreams of studying, working, 
                or living abroad a reality. Professional guidance every step of the way.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="btn-hero text-lg px-8 py-6"
                onClick={() => setShowLeadForm(true)}
              >
                Get Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="btn-outline-hero text-lg px-8 py-6"
              >
                View Success Stories
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-white/80">Countries</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <div className="text-2xl font-bold">10,000+</div>
                <div className="text-sm text-white/80">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Award className="h-8 w-8 text-accent" />
                </div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-white/80">Success Rate</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Start Your Journey Today
              </h3>
              <div className="space-y-4 text-white/90">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span>Free initial consultation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span>Document preparation assistance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span>Interview preparation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span>Post-visa support</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6 btn-hero"
                onClick={() => setShowLeadForm(true)}
              >
                Book Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showLeadForm && (
        <LeadForm onClose={() => setShowLeadForm(false)} />
      )}
    </section>
  );
};
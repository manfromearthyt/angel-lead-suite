import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">AA</span>
              </div>
              <span className="text-xl font-bold">Angel Art</span>
            </div>
            <p className="text-white/80 leading-relaxed">
              Your trusted partner for visa consultancy services. 
              Making global opportunities accessible to everyone.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-sm text-white/80">123 Business Street, City, Country</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent" />
                <span className="text-sm text-white/80">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-sm text-white/80">info@angelart.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-sm text-white/80">Mon-Fri: 9AM-6PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <a href="#services" className="block text-sm text-white/80 hover:text-accent transition-colors">
                Our Services
              </a>
              <a href="#about" className="block text-sm text-white/80 hover:text-accent transition-colors">
                About Us
              </a>
              <a href="#success-stories" className="block text-sm text-white/80 hover:text-accent transition-colors">
                Success Stories
              </a>
              <a href="#contact" className="block text-sm text-white/80 hover:text-accent transition-colors">
                Contact
              </a>
              <a href="/privacy" className="block text-sm text-white/80 hover:text-accent transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-white/80">
              Subscribe to get the latest immigration news and updates.
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="Enter your email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button className="w-full btn-hero">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-sm text-white/60">
            © 2024 Angel Art Visa Consultancy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
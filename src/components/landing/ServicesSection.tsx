import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Briefcase, Plane, Users, FileText, MessageCircle } from "lucide-react";

const services = [
  {
    icon: GraduationCap,
    title: "Student Visas",
    description: "Complete guidance for studying abroad, including university selection and application support.",
    features: ["University Selection", "Application Assistance", "Document Preparation", "Interview Coaching"]
  },
  {
    icon: Briefcase,
    title: "Work Visas",
    description: "Professional visa services for skilled workers and business professionals.",
    features: ["Job Market Analysis", "Employer Connections", "Work Permit Processing", "Career Guidance"]
  },
  {
    icon: Plane,
    title: "Tourist Visas",
    description: "Hassle-free tourist visa processing for your vacation or business travel.",
    features: ["Quick Processing", "Document Review", "Travel Planning", "Emergency Support"]
  },
  {
    icon: Users,
    title: "Family Visas",
    description: "Reunite with your loved ones through our family sponsorship programs.",
    features: ["Sponsorship Applications", "Relationship Documentation", "Legal Guidance", "Timeline Planning"]
  },
  {
    icon: FileText,
    title: "Document Services",
    description: "Professional document preparation and verification services.",
    features: ["Document Translation", "Notarization", "Verification", "Legal Formatting"]
  },
  {
    icon: MessageCircle,
    title: "Consultation",
    description: "Expert consultation to determine the best immigration pathway for you.",
    features: ["Eligibility Assessment", "Pathway Planning", "Cost Estimation", "Timeline Guidance"]
  }
];

export const ServicesSection = () => {
  return (
    <section id="services" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Our Comprehensive Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From initial consultation to post-visa support, we provide end-to-end 
            immigration services tailored to your specific needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="card-interactive border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <service.icon className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl text-primary">{service.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
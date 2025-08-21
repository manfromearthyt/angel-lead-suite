import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  userProfile: any;
}

export function DashboardHeader({ userProfile }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center px-6">
      <SidebarTrigger />
      <div className="ml-4">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      </div>
      <div className="ml-auto">
        <span className="text-sm text-muted-foreground">
          Welcome, {userProfile?.full_name}
        </span>
      </div>
    </header>
  );
}
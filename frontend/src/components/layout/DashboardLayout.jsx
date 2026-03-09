import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ 
  children, 
  title,
  menuItems = [],
  basePath = "",
}) {
  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar items={menuItems} basePath={basePath} />
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

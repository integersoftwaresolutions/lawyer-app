import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ 
  children, 
  title,
  menuItems = [],
  basePath = "",
}) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />
      
      <div className="flex">
        <Sidebar items={menuItems} basePath={basePath} />
        <main className="flex-1 min-w-0 ml-[280px] p-6 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

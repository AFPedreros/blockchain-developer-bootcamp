import Header from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <aside className="fixed inset-y-0 z-40 hidden h-full w-72 flex-col bg-card  md:flex">
        {/* <SideBar /> */}
        <p>Hola</p>
        <p>Hola</p>
        <p>Hola</p>
      </aside>
      <main className="flex h-full flex-1 flex-col md:pl-72">
        <Header/>

        <div className="flex-grow ">{children}</div>

        <footer className="container w-full bg-primary py-4 text-xs text-primary-foreground">
          <p>© 2024 TestDEX.</p>
        </footer>
      </main>
    </div>
  );
}

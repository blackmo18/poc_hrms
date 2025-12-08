import AppLayout from '../layout/AppLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppLayout>
        {children}
      </AppLayout>
    </div>
  );
}

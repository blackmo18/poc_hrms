import AppLayout from '../layout/AppLayout';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppLayout>
        {children}
      </AppLayout>
    </div>
  );
}

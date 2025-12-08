import AuthLayout from '@/app/components/layout/AuthPageLayout';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthLayout>
      {children}
    </AuthLayout>
  )
};

export default RootLayout;
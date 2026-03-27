import { Suspense } from 'react';
import ResetPasswordPageContent from './ResetPasswordPageContent';
import InitialLoadingScreen from '@/components/common/InitialLoadingScreen';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<InitialLoadingScreen title="Reset Password" subtitle="Reset your password" loadingText="Loading..." />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import OTRequestModal from './OTRequestModal';
import { PlusIcon } from 'lucide-react';

interface OTRequestButtonProps {
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export default function OTRequestButton({
  variant = 'primary',
  size = 'md',
  showIcon = true,
}: OTRequestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        startIcon={showIcon ? <PlusIcon className="h-4 w-4" /> : undefined}
      >
        File OT Request
      </Button>
      <OTRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

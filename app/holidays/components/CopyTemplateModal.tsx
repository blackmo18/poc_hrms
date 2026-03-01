'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { Modal } from '@/components/ui/modal';
import Select from '@/components/form/Select';
import { CalendarIcon, CopyIcon, LoaderIcon } from 'lucide-react';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  rateMultiplier: number;
  isPaidIfNotWorked: boolean;
  countsTowardOt: boolean;
}

interface HolidayTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  organization?: {
    id: string;
    name: string;
  };
  holidays: Holiday[];
}

interface CopyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: (result: any) => void;
}

// Simple Badge component
const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
}) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-700'
  };
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

export function CopyTemplateModal({ 
  isOpen, 
  onClose, 
  organizationId, 
  onSuccess 
}: CopyTemplateModalProps) {
  const [templates, setTemplates] = useState<HolidayTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchTemplates();
    }
  }, [isOpen, organizationId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/holiday-templates?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!selectedTemplate || !newTemplateName) return;

    setCopying(true);
    try {
      const response = await fetch('/api/holiday-templates/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          sourceTemplateId: selectedTemplate,
          newTemplateName,
          targetYear: parseInt(targetYear)
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess(data.data);
        onClose();
        // Reset form
        setSelectedTemplate('');
        setNewTemplateName('');
        setTargetYear(new Date().getFullYear().toString());
      } else {
        console.error('Error copying template:', data.error);
      }
    } catch (error) {
      console.error('Error copying template:', error);
    } finally {
      setCopying(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
    >
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Copy Holiday Template</h2>
          <p className="text-sm text-gray-600">
            Copy holidays from an existing template to create a new one for your organization.
          </p>
        </div>
      <div className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template">Select Template</Label>
          <Select
            value={selectedTemplate}
            onChange={(value) => setSelectedTemplate(value)}
            placeholder="Choose a template to copy from"
            options={templates.map((template) => ({
              value: template.id,
              label: template.name,
              badge: template.isDefault ? 'System' : template.organization?.name
            }))}
          />
        </div>

        {/* Template Preview */}
        {selectedTemplateData && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium">Template Preview</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {selectedTemplateData.description || 'No description'}
              </p>
              <div className="text-sm text-gray-500 mb-2">
                Contains {selectedTemplateData.holidays.length} holidays
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedTemplateData.holidays.slice(0, 5).map((holiday) => (
                  <div key={holiday.id} className="flex items-center gap-2 text-xs">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{new Date(holiday.date).toLocaleDateString()}</span>
                    <span>{holiday.name}</span>
                    <Badge 
                      variant={holiday.type === 'REGULAR' ? 'default' : 'secondary'} 
                      size="sm"
                    >
                      {holiday.type === 'REGULAR' ? 'Regular' : 'Special'}
                    </Badge>
                  </div>
                ))}
                {selectedTemplateData.holidays.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ...and {selectedTemplateData.holidays.length - 5} more
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Template Name */}
        <div className="space-y-2">
          <Label htmlFor="newName">New Template Name</Label>
          <Input
            id="newName"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Enter name for the new template"
          />
        </div>

        {/* Target Year */}
        <div className="space-y-2">
          <Label htmlFor="year">Target Year</Label>
          <Select
            value={targetYear}
            onChange={(value) => setTargetYear(value)}
            options={Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() + i - 2;
              return {
                value: year.toString(),
                label: year.toString()
              };
            })}
          />
        </div>
      </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={!selectedTemplate || !newTemplateName || copying}
          >
            {copying ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4 mr-2" />
                Copy Template
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

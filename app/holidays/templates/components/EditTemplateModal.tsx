'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { Modal } from '@/components/ui/modal';
import { CalendarIcon, PlusIcon, TrashIcon, LoaderIcon } from 'lucide-react';
import { createDateFromYYYYMMDD, formatUTCDateToReadable } from '@/lib/utils/date-utils';
import DatePicker from '@/components/form/date-picker';

interface Holiday {
  id: string;
  name: string;
  date: string | Date;
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
  holidays: Holiday[];
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: HolidayTemplate | null;
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

export function EditTemplateModal({ 
  isOpen, 
  onClose, 
  template, 
  onSuccess 
}: EditTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template && isOpen) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      // Format dates properly for date input fields and ensure rateMultiplier is a number
      const formattedHolidays = template.holidays.map(holiday => ({
        ...holiday,
        date: typeof holiday.date === 'string' 
          ? holiday.date.split('T')[0] 
          : new Date(holiday.date).toISOString().split('T')[0],
        rateMultiplier: typeof holiday.rateMultiplier === 'string' 
          ? parseFloat(holiday.rateMultiplier) 
          : holiday.rateMultiplier
      }));
      setHolidays(formattedHolidays);
    }
  }, [template, isOpen]);

  const handleAddHoliday = () => {
    const newHoliday: Holiday = {
      id: `temp-${Date.now()}`,
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'REGULAR',
      rateMultiplier: 1.0,
      isPaidIfNotWorked: false,
      countsTowardOt: true
    };
    setHolidays([...holidays, newHoliday]);
  };

  const handleRemoveHoliday = (index: number) => {
    setHolidays(holidays.filter((_, i) => i !== index));
  };

  const handleHolidayChange = (index: number, field: keyof Holiday, value: any) => {
    const updatedHolidays = [...holidays];
    updatedHolidays[index] = {
      ...updatedHolidays[index],
      [field]: field === 'rateMultiplier' ? parseFloat(value) : value
    };
    setHolidays(updatedHolidays);
  };

  const handleSave = async () => {
    if (!template || !templateName.trim()) return;

    setSaving(true);
    try {
      // Format holidays with proper date handling and ensure IDs are preserved or generated
      const formattedHolidays = holidays.filter(h => h.name.trim()).map(holiday => {
        // Handle date properly - avoid timezone conversion
        let dateStr: string;
        if (typeof holiday.date === 'string') {
          dateStr = holiday.date.includes('T') ? holiday.date.split('T')[0] : holiday.date;
        } else {
          dateStr = holiday.date.getFullYear() + '-' + 
            String(holiday.date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(holiday.date.getDate()).padStart(2, '0');
        }

        return {
          id: holiday.id.startsWith('temp-') ? undefined : holiday.id, // Let backend generate new IDs for temp holidays
          name: holiday.name.trim(),
          date: dateStr, // Send as YYYY-MM-DD string, not ISO string
          type: holiday.type,
          rateMultiplier: holiday.rateMultiplier,
          isPaidIfNotWorked: holiday.isPaidIfNotWorked,
          countsTowardOt: holiday.countsTowardOt
        };
      });

      const response = await fetch(`/api/holiday-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim(),
          holidays: formattedHolidays,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        console.error('Error updating template:', data.error);
        alert(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatUTCDateToReadable(dateStr);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Edit Holiday Template</h2>
          <p className="text-sm text-gray-600">
            Update template information and holidays
          </p>
        </div>

        <div className="space-y-6">
          {/* Template Information */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium">Template Information</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Input
                    id="templateDescription"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Enter template description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holidays */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Holidays ({holidays.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddHoliday}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No holidays added. Click "Add Holiday" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {holidays.map((holiday, index) => (
                    <div key={holiday.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Holiday Name</Label>
                          <Input
                            value={holiday.name}
                            onChange={(e) => handleHolidayChange(index, 'name', e.target.value)}
                            placeholder="Holiday name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <DatePicker
                            id={`holiday-date-${index}`}
                            onChange={(selectedDates) => {
                              if (selectedDates && selectedDates.length > 0) {
                                const date = selectedDates[0];
                                if (date instanceof Date) {
                                  handleHolidayChange(index, 'date', date);
                                }
                              }
                            }}
                            placeholder="Select holiday date"
                            defaultDate={typeof holiday.date === 'string' ? holiday.date : holiday.date.toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select
                            value={holiday.type}
                            onChange={(e) => handleHolidayChange(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="REGULAR">Regular</option>
                            <option value="SPECIAL_NON_WORKING">Special Non-Working</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Rate Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={holiday.rateMultiplier.toString()}
                            onChange={(e) => handleHolidayChange(index, 'rateMultiplier', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={holiday.isPaidIfNotWorked}
                              onChange={(e) => handleHolidayChange(index, 'isPaidIfNotWorked', e.target.checked)}
                            />
                            <span className="text-sm">Paid if not worked</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={holiday.countsTowardOt}
                              onChange={(e) => handleHolidayChange(index, 'countsTowardOt', e.target.checked)}
                            />
                            <span className="text-sm">Counts toward OT</span>
                          </label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveHoliday(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!templateName.trim() || saving}
          >
            {saving ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Template'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

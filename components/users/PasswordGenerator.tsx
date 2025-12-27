"use client";

import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

interface PasswordGeneratorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
}

export default function PasswordGenerator({
  value,
  onChange,
  onGenerate,
  disabled = false,
  error = false,
  errorMessage = "",
}: PasswordGeneratorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="generated_password">Generated Password</Label>
        <div className="flex gap-3">
          <Input
            id="generated_password"
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Click generate to create password"
            error={error}
            className="flex-1"
            readOnly
          />
          <Button
            variant="outline"
            size="md"
            onClick={onGenerate}
            disabled={disabled}
            className="whitespace-nowrap"
          >
            Generate
          </Button>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Format: [lastname.firstname.yyyy.mm.dd]-[random alphanumeric 7]
        </p>
        {errorMessage && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

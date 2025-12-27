"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

interface ActionInputProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onClick: () => void;
  displayValue?: string;
  label?: string;
}

export default function ActionInput({
  value,
  placeholder = "Click to select",
  disabled = false,
  onClick,
  displayValue,
  label,
}: ActionInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={displayValue || value || ""}
            placeholder={placeholder}
            readOnly
            className="cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onClick();
          }}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
        >
          <PlusIcon className="w-4 h-4" />
          Select
        </button>
      </div>
    </div>
  );
}

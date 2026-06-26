"use client";

import {
  signupAccountOptions,
  type SignupAccountType,
} from "@/lib/organization";
import { cn } from "@/lib/utils";

interface SignupAccountTypePickerProps {
  value: SignupAccountType;
  onChange: (value: SignupAccountType) => void;
}

export function SignupAccountTypePicker({
  value,
  onChange,
}: SignupAccountTypePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">I am signing up as a</p>
      <div className="grid gap-2">
        {signupAccountOptions.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                selected
                  ? "border-accent/40 bg-accent/10 ring-1 ring-accent/30"
                  : "border-white/[0.08] bg-surface hover:border-white/[0.14]"
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  selected ? "text-accent-light" : "text-gray-200"
                )}
              >
                {option.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

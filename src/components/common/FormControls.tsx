import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Input as BaseInput } from "@/components/ui/input";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldProps = {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
};

type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    FieldProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      leftIcon,
      rightIcon,
      size = "md",
      className,
      id,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? `field-${generatedId}`;
    const messageId = `${inputId}-message`;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&>svg]:size-[18px]">
              {leftIcon}
            </span>
          )}
          <BaseInput
            {...props}
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : props["aria-invalid"]}
            aria-describedby={[describedBy, (error || hint) ? messageId : null].filter(Boolean).join(" ") || undefined}
            className={cn(
              size === "sm" && "form-control--sm",
              size === "lg" && "form-control--lg",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
            )}
          />
          {rightIcon && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground [&>svg]:size-[18px]">
              {rightIcon}
            </span>
          )}
        </div>
        {(error || hint) && (
          <p id={messageId} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange">,
    FieldProps {
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      options,
      placeholder,
      onChange,
      className,
      id,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const selectId = id ?? `field-${generatedId}`;
    const messageId = `${selectId}-message`;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", className)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={selectId}
            onChange={(event) => onChange?.(event.target.value)}
            aria-invalid={error ? true : props["aria-invalid"]}
            aria-describedby={[describedBy, (error || hint) ? messageId : null].filter(Boolean).join(" ") || undefined}
            className="form-control appearance-none pr-10"
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {(error || hint) && (
          <p id={messageId} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      className,
      id,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? `field-${generatedId}`;
    const messageId = `${textareaId}-message`;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", className)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <BaseTextarea
          {...props}
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={[describedBy, (error || hint) ? messageId : null].filter(Boolean).join(" ") || undefined}
        />
        {(error || hint) && (
          <p id={messageId} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./CatalogSelect.module.css";

interface CatalogSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange?: (value: string) => void;
  size?: "sm" | "md";
}

export const CatalogSelect = forwardRef<HTMLSelectElement, CatalogSelectProps>(
  ({ options, onChange, className = "", id, size = "sm", ...props }, ref) => {
    const generatedId = useId();
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <select {...props} ref={ref} id={id ?? `catalog-select-${generatedId}`} className={`${styles.select} ${size === "md" ? styles.md : ""}`} onChange={(event) => onChange?.(event.target.value)}>
          {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className={styles.icon} size={18} />
      </div>
    );
  },
);

CatalogSelect.displayName = "CatalogSelect";

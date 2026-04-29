import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export const SelectTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...props}>{children}</button>;
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <span>{placeholder}</span>;
};

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative">{children}</div>;
};

export const SelectItem = ({ children, value, ...props }: React.OptionHTMLOptionElement>) => {
  return <option value={value} {...props}>{children}</option>;
};

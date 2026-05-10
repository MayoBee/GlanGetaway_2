import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationMessageProps {
  message?: string;
  type?: 'error' | 'success' | 'warning';
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  type = 'error',
  className
}) => {
  if (!message) return null;

  const baseStyles = "flex items-center gap-2 text-sm mt-1 transition-all duration-200";
  
  const typeStyles = {
    error: "text-red-600",
    success: "text-green-600", 
    warning: "text-yellow-600"
  };

  const icons = {
    error: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />
  };

  return (
    <div className={cn(baseStyles, typeStyles[type], className)}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
  type?: 'error' | 'warning';
}

interface FieldValidatorProps {
  value: string;
  rules: ValidationRule[];
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  children: (validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    showValidation: boolean;
  }) => React.ReactNode;
}

export const FieldValidator: React.FC<FieldValidatorProps> = ({
  value,
  rules,
  onValidationChange,
  children
}) => {
  const [touched, setTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  React.useEffect(() => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    rules.forEach(rule => {
      if (!rule.validate(value)) {
        if (rule.type === 'warning') {
          newWarnings.push(rule.message);
        } else {
          newErrors.push(rule.message);
        }
      }
    });

    setErrors(newErrors);
    setWarnings(newWarnings);
    onValidationChange?.(newErrors.length === 0, [...newErrors, ...newWarnings]);
  }, [value, rules, onValidationChange]);

  const validation = {
    isValid: errors.length === 0,
    errors,
    warnings,
    showValidation: touched || errors.length > 0
  };

  return (
    <div onBlur={() => setTouched(true)}>
      {children(validation)}
    </div>
  );
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
    type: 'error'
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    },
    message,
    type: 'error'
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    validate: (value) => {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return !value || (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10);
    },
    message,
    type: 'error'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
    type: 'error'
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
    type: 'error'
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => !value || regex.test(value),
    message,
    type: 'error'
  }),

  numeric: (message = 'Please enter a valid number'): ValidationRule => ({
    validate: (value) => !value || !isNaN(Number(value)),
    message,
    type: 'error'
  }),

  positiveNumber: (message = 'Please enter a positive number'): ValidationRule => ({
    validate: (value) => !value || (Number(value) > 0),
    message,
    type: 'error'
  })
};

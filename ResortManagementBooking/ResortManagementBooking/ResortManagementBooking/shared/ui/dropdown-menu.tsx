import React, { useState, useEffect, useRef } from 'react';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isOpen, setIsOpen } as any);
        }
        return child;
      })}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, asChild, isOpen, setIsOpen, ...props }: DropdownMenuTriggerProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) => {
  const handleClick = () => {
    if (setIsOpen) {
      setIsOpen(!isOpen);
    }
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick
    });
  }
  
  return (
    <div
      className="inline-flex"
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
}

export const DropdownMenuContent = ({ children, className = '', align = 'end', isOpen, setIsOpen, ...props }: DropdownMenuContentProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) => {
  const alignmentClasses = align === 'start' ? 'left-0' : align === 'center' ? 'left-1/2 transform -translate-x-1/2' : 'right-0';
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className={`absolute ${alignmentClasses} mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${className}`} {...props}>
      <div className="py-1">{children}</div>
    </div>
  );
};

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}

export const DropdownMenuItem = ({ children, onClick, className = '', asChild, setIsOpen, ...props }: DropdownMenuItemProps & { setIsOpen?: (open: boolean) => void }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    // Close dropdown after click
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  if (asChild) {
    const childElement = children as React.ReactElement;
    const childProps = {
      onClick: handleClick
    };
    
    // If the child is already a button or link, just add the click handler
    return React.cloneElement(childElement, childProps);
  }
  
  return (
    <button
      onClick={handleClick}
      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = () => {
  return <div className="border-t border-gray-100 my-1" />;
};

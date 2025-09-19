// client/src/components/common/Button.tsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const isDisabled = disabled || loading;

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

export default Button;
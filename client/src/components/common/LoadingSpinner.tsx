// client/src/components/common/LoadingSpinner.tsx
import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return <div className={spinnerClasses}></div>;
};

export default LoadingSpinner;

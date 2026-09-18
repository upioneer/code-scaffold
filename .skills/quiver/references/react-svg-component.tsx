import React from 'react';

export interface QuiverVectorProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  title?: string;
}

/**
 * Reusable React component wrapper for AI-generated vector graphics
 * Ensures strict accessibility, responsive viewBox containment, and design system integration
 */
export const QuiverVector: React.FC<QuiverVectorProps & { children: React.ReactNode; viewBox?: string }> = ({
  size = 32,
  className = '',
  title,
  viewBox = '0 0 512 512',
  children,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="currentColor"
      className={`inline-block shrink-0 align-middle transition-colors duration-200 ${className}`}
      aria-hidden={!title}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
};

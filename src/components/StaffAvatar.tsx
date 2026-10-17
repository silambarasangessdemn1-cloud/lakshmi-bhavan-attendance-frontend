import React, { useState } from 'react';

interface StaffAvatarProps {
  name: string;
  photo?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorVariants = [
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-slate-100 text-slate-800 border-slate-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
];

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  name,
  photo,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Compute initials
  const initials = (name || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  // Stable color based on name hash
  const colorIndex = Math.abs(
    (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % colorVariants.length;
  const colorClass = colorVariants[colorIndex];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  }[size];

  if (photo && !hasError) {
    return (
      <img
        src={photo}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${sizeClasses} rounded-full object-cover border border-slate-200 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} ${colorClass} rounded-full border flex items-center justify-center font-medium shrink-0 select-none ${className}`}
      title={name}
    >
      {initials || 'U'}
    </div>
  );
};

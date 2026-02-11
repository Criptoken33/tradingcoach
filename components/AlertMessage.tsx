import React from 'react';
import { InfoIcon, ExclamationTriangleIcon, StarIcon } from './icons';

interface AlertMessageProps {
  type: 'warning' | 'error' | 'info';
  text: string;
  size?: 'small' | 'large';
}

const AlertMessage: React.FC<AlertMessageProps> = ({ type, text, size = 'large' }) => {
  const isSmall = size === 'small';

  const config = {
    warning: {
      bgColor: 'bg-brand-warning-high/10',
      textColor: 'text-brand-warning-high',
      borderColor: 'border-transparent', // Often not needed for inline warnings
      Icon: InfoIcon,
    },
    error: {
      bgColor: 'bg-brand-danger/10',
      textColor: 'text-brand-danger',
      borderColor: 'border-brand-danger/20',
      Icon: ExclamationTriangleIcon,
    },
    info: {
      bgColor: 'bg-brand-accent/10',
      textColor: 'text-brand-accent',
      borderColor: 'border-transparent',
      Icon: StarIcon,
    },
  };

  const { bgColor, textColor, borderColor, Icon } = config[type];

  const sizeClasses = isSmall
    ? 'body-small p-2 rounded-lg gap-2 mt-1'
    : 'body-medium p-3 rounded-xl gap-3';

  const iconSize = isSmall ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className={`flex items-start sm:items-center ${bgColor} ${textColor} border ${borderColor} ${sizeClasses}`}>
      <Icon className={`${iconSize} flex-shrink-0 mt-0.5 sm:mt-0`} />
      <span>{text}</span>
    </div>
  );
};

export default AlertMessage;
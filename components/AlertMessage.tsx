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
      bgColor: 'bg-tc-warning/10',
      textColor: 'text-tc-warning',
      borderColor: 'border-transparent',
      Icon: InfoIcon,
    },
    error: {
      bgColor: 'bg-tc-error/10',
      textColor: 'text-tc-error',
      borderColor: 'border-tc-error/20',
      Icon: ExclamationTriangleIcon,
    },
    info: {
      bgColor: 'bg-tc-growth-green/10',
      textColor: 'text-tc-growth-green',
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
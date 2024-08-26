import React from 'react';
import { useRouter } from 'next/router';
import IconButton from './IconButton';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className }) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <IconButton
      tooltip="Go Back"
      icon="backArrow"
      className={className}
      onClick={handleBackClick}
    />
  );
};

export default BackButton;
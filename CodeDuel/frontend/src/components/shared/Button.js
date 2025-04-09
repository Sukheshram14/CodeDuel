import { theme as appTheme } from '../../styles/theme'; 

const Button = ({ children, onClick, variant = 'primary', disabled }) => {
  const getButtonClasses = () => {
    const baseClasses = "px-6 py-2 rounded-lg text-white font-medium";
    
    if (disabled) {
      return `${baseClasses} bg-gray-600 cursor-not-allowed`;
    }

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600`;
      case 'secondary':
        return `${baseClasses} bg-gray-600`;
      case 'success':
        return `${baseClasses} bg-green-600`;
      case 'error':
        return `${baseClasses} bg-red-600`;
      default:
        return `${baseClasses} bg-blue-600`;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={getButtonClasses()}
    >
      {children}
    </button>
  );
}; 
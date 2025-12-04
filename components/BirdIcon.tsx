import React from 'react';
import { Bird, Activity } from '../types';
import { Feather, CloudMoon, Sun, ShieldAlert, Skull, Crown, Utensils, Footprints, Bed } from 'lucide-react';

interface BirdIconProps {
  bird: Bird;
  className?: string;
  size?: number;
}

export const BirdIcon: React.FC<BirdIconProps> = ({ bird, className = "", size = 24 }) => {
  const getIcon = () => {
    switch (bird) {
      case Bird.VULTURE: return <Feather size={size} className={className} />;
      case Bird.OWL: return <CloudMoon size={size} className={className} />;
      case Bird.CROW: return <Feather size={size} className={className} />; 
      case Bird.COCK: return <Sun size={size} className={className} />;
      case Bird.PEACOCK: return <Feather size={size} className={className} />;
      default: return <Feather size={size} className={className} />;
    }
  };

  return (
    <div title={bird} className={`inline-flex items-center justify-center ${className}`}>
        <span className="mr-2 font-serif font-bold">{bird}</span>
        {getIcon()}
    </div>
  );
};

interface ActivityIconProps {
    activity: Activity;
    className?: string;
    size?: number;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({ activity, className = "", size = 20 }) => {
    switch (activity) {
        case Activity.RULE: return <Crown size={size} className={`text-yellow-400 ${className}`} />;
        case Activity.EAT: return <Utensils size={size} className={`text-green-400 ${className}`} />;
        case Activity.WALK: return <Footprints size={size} className={`text-blue-400 ${className}`} />;
        case Activity.SLEEP: return <Bed size={size} className={`text-gray-400 ${className}`} />;
        case Activity.DIE: return <Skull size={size} className={`text-red-500 ${className}`} />;
        default: return null;
    }
}
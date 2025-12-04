
import React from 'react';
import { Bird, Activity, BirdRelation } from '../types';
import { BirdIcon, ActivityIcon } from './BirdIcon';
import clsx from 'clsx';
import { Handshake, Shield, Star, Scale } from 'lucide-react';

interface ResultCardProps {
  teamName: string;
  bird: Bird;
  activity: Activity;
  relation?: BirdRelation;
  isWinner: boolean;
  isDraw: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ teamName, bird, activity, relation, isWinner, isDraw }) => {
  const isNegativeState = activity === Activity.SLEEP || activity === Activity.DIE;
  
  const getRelationIcon = (rel: BirdRelation) => {
    switch (rel) {
      case BirdRelation.SELF: return <Star size={12} />;
      case BirdRelation.FRIEND: return <Handshake size={12} />;
      case BirdRelation.ENEMY: return <Shield size={12} />;
      default: return <Scale size={12} />;
    }
  };

  const getRelationColor = (rel: BirdRelation) => {
    switch (rel) {
      case BirdRelation.SELF: return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case BirdRelation.FRIEND: return "bg-green-500/20 text-green-300 border-green-500/30";
      case BirdRelation.ENEMY: return "bg-red-500/20 text-red-300 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className={clsx(
      "relative overflow-hidden rounded-xl p-6 border-2 transition-all duration-500 transform hover:scale-105",
      isWinner 
        ? "bg-gradient-to-br from-mystic-800 to-mystic-900 border-mystic-gold shadow-[0_0_20px_rgba(251,191,36,0.3)]" 
        : "bg-mystic-800 border-mystic-700 opacity-90",
      !isWinner && !isDraw && isNegativeState && "grayscale-[0.5]"
    )}>
      {isWinner && (
        <div className="absolute top-0 right-0 bg-mystic-gold text-mystic-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
          WINNER
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">{teamName}</h3>
        {relation && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRelationColor(relation)}`}>
               {getRelationIcon(relation)}
               {relation}
            </div>
        )}
      </div>

      <div className="flex items-center space-x-2 mb-4 text-mystic-gold">
         <span className="text-sm opacity-75">Bird:</span>
         <BirdIcon bird={bird} />
      </div>

      <div className="flex items-center justify-between mt-4 bg-mystic-900/50 p-3 rounded-lg border border-white/5">
        <span className="text-sm text-gray-400 uppercase tracking-widest text-[10px]">Current State</span>
        <div className="flex items-center space-x-2">
           <ActivityIcon activity={activity} />
           <span className={clsx(
               "font-bold",
               activity === Activity.RULE && "text-yellow-400",
               activity === Activity.EAT && "text-green-400",
               activity === Activity.DIE && "text-red-500",
               activity === Activity.SLEEP && "text-gray-400",
               activity === Activity.WALK && "text-blue-400",
           )}>
               {activity}
           </span>
        </div>
      </div>
      
      {/* Power Bar */}
      <div className="mt-3 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div 
            className={clsx("h-full transition-all duration-1000 ease-out", 
                activity === Activity.RULE ? "w-full bg-yellow-400" :
                activity === Activity.EAT ? "w-3/4 bg-green-400" :
                activity === Activity.WALK ? "w-1/2 bg-blue-400" :
                activity === Activity.SLEEP ? "w-1/4 bg-gray-400" :
                "w-[5%] bg-red-500"
            )}
        />
      </div>
    </div>
  );
};

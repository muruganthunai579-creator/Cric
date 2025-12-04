
export enum Bird {
  VULTURE = 'Valluru (Vulture)',
  OWL = 'Aandhai (Owl)',
  CROW = 'Kakam (Crow)',
  COCK = 'Kozhi (Cock)',
  PEACOCK = 'Mayil (Peacock)'
}

export enum Activity {
  RULE = 'Arasu (Rule)',
  EAT = 'Oon (Eat)',
  WALK = 'Nadai (Walk)',
  SLEEP = 'Thuyil (Sleep)',
  DIE = 'Saavu (Die)'
}

export enum MoonPhase {
  WAXING = 'Valar Pirai', // Shukla Paksha
  WANING = 'Thei Pirai'   // Krishna Paksha
}

export enum DayTime {
  DAY = 'Day',
  NIGHT = 'Night'
}

export enum MatchFormat {
  T20 = 'T20',
  ODI = 'ODI'
}

export enum BirdRelation {
  SELF = 'Dominant (Self)',
  FRIEND = 'Friend of Ruler',
  ENEMY = 'Enemy of Ruler',
  NEUTRAL = 'Neutral'
}

export interface PlayerDetails {
  name: string;
  dob: string;
  star: string; // Nakshatra
}

export interface FlowPoint {
  time: string;
  teamA_Power: number;
  teamB_Power: number;
  dominantTeam: string;
  activityA: Activity;
  activityB: Activity;
}

export interface PredictionState {
  teamA: string;
  teamB: string;
  captainA: PlayerDetails;
  captainB: PlayerDetails;
  birdA: Bird;
  birdB: Bird;
  activityA: Activity;
  activityB: Activity;
  winner: string | 'Draw';
  winProbability: number; // 0-100
  timeSlot: number; // Yama 1-5
  dayTime: DayTime;
  moonPhase: MoonPhase;
  dayOfWeek: string;
  birdColorA: string;
  birdColorB: string;
  rulingBird: Bird; // The bird currently in 'Rule' state
  tossWinner: string;
  tossActivityA: Activity;
  tossActivityB: Activity;
  matchFlow: FlowPoint[];
  matchFormat: MatchFormat;
  // New fields for Book Based Relationships
  relationA: BirdRelation;
  relationB: BirdRelation;
  tossRelationA: BirdRelation;
  tossRelationB: BirdRelation;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

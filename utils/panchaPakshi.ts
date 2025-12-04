
import { Bird, Activity, MoonPhase, DayTime, PlayerDetails, PredictionState, MatchFormat, FlowPoint, BirdRelation } from '../types';

export const NAKSHATRAS = [
  "Aswini", "Bharani", "Krithigai", "Rohini", "Mrigashirsham", 
  "Thiruvathirai", "Punarpoosam", "Poosam", "Ayilyam", "Magam", "Pooram", 
  "Uthiram", "Hastham", "Chithirai", "Swathi", "Visakam", 
  "Anusham", "Kettai", "Moolam", "Pooradam", "Uthiradam", 
  "Thiruvonam", "Avittam", "Sathayam", "Poorattathi", "Uthirattathi", "Revathi"
];

const birdsOrder = [Bird.VULTURE, Bird.OWL, Bird.CROW, Bird.COCK, Bird.PEACOCK];

// Power Values
const activityPower: Record<Activity, number> = {
  [Activity.RULE]: 100,
  [Activity.EAT]: 80,
  [Activity.WALK]: 50,
  [Activity.SLEEP]: 25,
  [Activity.DIE]: 0
};

// --- ACTIVITY CYCLES ---
// Shukla Paksha (Valar Pirai): Rule -> Sleep -> Die -> Eat -> Walk
const cycleShukla = [Activity.RULE, Activity.SLEEP, Activity.DIE, Activity.EAT, Activity.WALK];

// Krishna Paksha (Thei Pirai): Rule -> Walk -> Eat -> Die -> Sleep (As per book tables)
const cycleKrishna = [Activity.RULE, Activity.WALK, Activity.EAT, Activity.DIE, Activity.SLEEP];

// --- RELATIONSHIP MAPS (Book Pages 22 & 35) ---
const BIRD_RELATIONSHIPS = {
  [MoonPhase.WAXING]: { // Valar Pirai (Page 22)
    [Bird.VULTURE]: { friends: [Bird.PEACOCK, Bird.OWL], enemies: [Bird.CROW, Bird.COCK] },
    [Bird.OWL]:     { friends: [Bird.VULTURE, Bird.CROW], enemies: [Bird.COCK, Bird.PEACOCK] },
    [Bird.CROW]:    { friends: [Bird.COCK, Bird.OWL],     enemies: [Bird.VULTURE, Bird.PEACOCK] },
    [Bird.COCK]:    { friends: [Bird.CROW, Bird.PEACOCK], enemies: [Bird.VULTURE, Bird.OWL] },
    [Bird.PEACOCK]: { friends: [Bird.VULTURE, Bird.COCK], enemies: [Bird.OWL, Bird.CROW] },
  },
  [MoonPhase.WANING]: { // Thei Pirai (Page 35)
    [Bird.VULTURE]: { friends: [Bird.PEACOCK, Bird.CROW], enemies: [Bird.OWL, Bird.COCK] },
    [Bird.OWL]:     { friends: [Bird.CROW, Bird.COCK],    enemies: [Bird.VULTURE, Bird.PEACOCK] },
    [Bird.CROW]:    { friends: [Bird.VULTURE, Bird.OWL],  enemies: [Bird.PEACOCK, Bird.COCK] },
    [Bird.COCK]:    { friends: [Bird.PEACOCK, Bird.OWL],  enemies: [Bird.VULTURE, Bird.CROW] },
    [Bird.PEACOCK]: { friends: [Bird.VULTURE, Bird.COCK], enemies: [Bird.OWL, Bird.CROW] },
  }
};

const getBirdRelationship = (subject: Bird, ruler: Bird, phase: MoonPhase): BirdRelation => {
  if (subject === ruler) return BirdRelation.SELF;
  
  const rels = BIRD_RELATIONSHIPS[phase][subject];
  if (rels.friends.includes(ruler)) return BirdRelation.FRIEND;
  if (rels.enemies.includes(ruler)) return BirdRelation.ENEMY;
  
  return BirdRelation.NEUTRAL;
};

// --- AUTO NAKSHATRA CALCULATION ---
export const calculateNakshatra = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const anchorDate = new Date('2024-01-01T12:00:00Z').getTime(); // Approx Anchor
    const anchorIndex = 9.5; // Magam
    
    const targetDate = new Date(dateStr + 'T12:00:00Z').getTime();
    const diffDays = (targetDate - anchorDate) / (1000 * 60 * 60 * 24);
    
    const starsMoved = diffDays * 0.98822; // Daily motion
    
    let rawIndex = (anchorIndex + starsMoved) % 27;
    if (rawIndex < 0) rawIndex += 27;
    
    const index = Math.floor(rawIndex);
    return NAKSHATRAS[index];
  } catch (e) {
    return "";
  }
};

// --- BIRD DETERMINATION (Pages 17 & 30) ---
const getBirdByStar = (starIndex: number, phase: MoonPhase): Bird => {
  const group1 = [0, 1, 2, 3, 4]; // Aswini - Mrigashirsham
  const group2 = [5, 6, 7, 8, 9, 10]; // Thiruvathirai - Pooram
  const group3 = [11, 12, 13, 14, 15]; // Uthiram - Visakam
  const group4 = [16, 17, 18, 19, 20]; // Anusham - Uthiradam
  const group5 = [21, 22, 23, 24, 25, 26]; // Thiruvonam - Revathi

  if (phase === MoonPhase.WAXING) {
    if (group1.includes(starIndex)) return Bird.VULTURE;
    if (group2.includes(starIndex)) return Bird.OWL;
    if (group3.includes(starIndex)) return Bird.CROW;
    if (group4.includes(starIndex)) return Bird.COCK;
    if (group5.includes(starIndex)) return Bird.PEACOCK;
  } else {
    // Thei Pirai Mapping (Page 30)
    if (group5.includes(starIndex)) return Bird.VULTURE; 
    if (group4.includes(starIndex)) return Bird.OWL;     
    if (group3.includes(starIndex)) return Bird.CROW;    
    if (group2.includes(starIndex)) return Bird.COCK;    
    if (group1.includes(starIndex)) return Bird.PEACOCK; 
  }
  return Bird.VULTURE;
};

const getBirdByName = (name: string, phase: MoonPhase): Bird => {
  if (!name) return Bird.VULTURE;
  const char = name.trim().toLowerCase()[0];
  
  const isA = (c: string) => ['a'].includes(c);
  const isI = (c: string) => ['i', 'l', 'r'].includes(c);
  const isU = (c: string) => ['u', 'k'].includes(c);
  const isE = (c: string) => ['e', 'm', 't'].includes(c);
  const isO = (c: string) => ['o', 'n', 'p', 's'].includes(c);

  if (phase === MoonPhase.WAXING) {
     if (isA(char)) return Bird.VULTURE;
     if (isI(char)) return Bird.OWL;
     if (isU(char)) return Bird.CROW;
     if (isE(char)) return Bird.COCK;
     return Bird.PEACOCK;
  } else {
     if (isA(char)) return Bird.COCK;
     if (isI(char)) return Bird.VULTURE;
     if (isU(char)) return Bird.OWL;
     if (isE(char)) return Bird.PEACOCK;
     return Bird.CROW;
  }
};

export const getBird = (details: PlayerDetails, phase: MoonPhase): Bird => {
  if (details.star) {
    const starIndex = NAKSHATRAS.indexOf(details.star);
    if (starIndex >= 0) return getBirdByStar(starIndex, phase);
  }
  return getBirdByName(details.name, phase);
};

// --- COLOR MAPPING (Pages 19 & 32) ---
export const getBirdColor = (bird: Bird, phase: MoonPhase): string => {
  if (phase === MoonPhase.WAXING) {
    switch(bird) {
      case Bird.VULTURE: return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"; // Pon (Gold)
      case Bird.OWL: return "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"; // Vellai (White)
      case Bird.CROW: return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"; // Sivappu (Red)
      case Bird.COCK: return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"; // Pachai (Green)
      case Bird.PEACOCK: return "text-gray-900 bg-slate-200 px-1 rounded shadow-inner"; // Karuppu (Black)
    }
  } else {
    switch(bird) {
      case Bird.VULTURE: return "text-gray-900 bg-slate-200 px-1 rounded shadow-inner"; // Karuppu
      case Bird.OWL: return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"; // Sigappu
      case Bird.CROW: return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"; // Pon
      case Bird.COCK: return "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"; // Vellai
      case Bird.PEACOCK: return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"; // Pachai
    }
  }
  return "text-gray-200";
};

// --- START ACTIVITY TABLES (Based on Pages 25-29 & 38-42) ---
// Returns the Starting Activity for [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
const getStartSequence = (bird: Bird, isNight: boolean, phase: MoonPhase): Activity[] => {
  const { RULE, EAT, WALK, SLEEP, DIE } = Activity;
  const { VULTURE, OWL, CROW, COCK, PEACOCK } = Bird;

  if (phase === MoonPhase.WAXING) {
    if (!isNight) {
      // Day (Valar)
      if (bird === VULTURE) return [EAT, DIE, EAT, DIE, SLEEP, RULE, WALK]; // Pg 25 Day
      if (bird === OWL)     return [WALK, EAT, WALK, EAT, DIE, SLEEP, RULE]; // Pg 26 Day
      if (bird === CROW)    return [RULE, WALK, RULE, WALK, EAT, DIE, SLEEP]; // Pg 27 Day
      if (bird === COCK)    return [SLEEP, RULE, SLEEP, RULE, WALK, EAT, DIE]; // Pg 28 Day
      if (bird === PEACOCK) return [DIE, SLEEP, DIE, SLEEP, RULE, WALK, EAT]; // Pg 29 Day
    } else {
      // Night (Valar)
      if (bird === VULTURE) return [DIE, WALK, DIE, WALK, SLEEP, EAT, RULE]; // Pg 25 Night
      if (bird === OWL)     return [RULE, DIE, RULE, DIE, WALK, SLEEP, EAT]; // Pg 26 Night
      if (bird === CROW)    return [EAT, RULE, EAT, RULE, DIE, WALK, SLEEP]; // Pg 27 Night
      if (bird === COCK)    return [SLEEP, EAT, SLEEP, EAT, RULE, DIE, WALK]; // Pg 28 Night
      if (bird === PEACOCK) return [WALK, SLEEP, WALK, SLEEP, EAT, RULE, DIE]; // Pg 29 Night
    }
  } else {
    // Krishna Paksha (Thei Pirai)
    if (!isNight) {
      // Day (Thei) - Pg 38-42
      if (bird === VULTURE) return [WALK, SLEEP, WALK, DIE, RULE, EAT, SLEEP]; // Pg 38 Day
      if (bird === OWL)     return [DIE, WALK, DIE, RULE, EAT, DIE, WALK];     // Pg 39 Day 
      if (bird === CROW)    return [RULE, DIE, RULE, EAT, WALK, SLEEP, DIE]; // Pg 40
      if (bird === COCK)    return [EAT, RULE, EAT, SLEEP, DIE, WALK, RULE]; // Pg 41
      if (bird === PEACOCK) return [SLEEP, EAT, SLEEP, WALK, SLEEP, RULE, EAT]; // Pg 42
    } else {
      // Night (Thei)
      if (bird === VULTURE) return [EAT, WALK, EAT, WALK, SLEEP, DIE, RULE];
      if (bird === OWL)     return [EAT, WALK, EAT, WALK, SLEEP, DIE, RULE]; // Note: Table overlap logic
      if (bird === CROW)    return [RULE, SLEEP, RULE, SLEEP, EAT, WALK, SLEEP];
      if (bird === COCK)    return [SLEEP, EAT, SLEEP, EAT, RULE, DIE, WALK];
      if (bird === PEACOCK) return [DIE, RULE, DIE, RULE, WALK, SLEEP, EAT];
    }
  }
  return [RULE, RULE, RULE, RULE, RULE, RULE, RULE]; // Fallback
};

const getStartActivity = (bird: Bird, dayIndex: number, isNight: boolean, phase: MoonPhase): Activity => {
  const sequence = getStartSequence(bird, isNight, phase);
  return sequence[dayIndex];
};

const getActivityForYama = (startActivity: Activity, yama: number, phase: MoonPhase): Activity => {
  const cycle = phase === MoonPhase.WAXING ? cycleShukla : cycleKrishna;
  const startIndex = cycle.indexOf(startActivity);
  const currentIndex = (startIndex + (yama - 1)) % 5;
  return cycle[currentIndex];
};

const getRulingBirdForYama = (dayIndex: number, isNight: boolean, moonPhase: MoonPhase, yama: number): Bird => {
  for (const bird of birdsOrder) {
    const startAct = getStartActivity(bird, dayIndex, isNight, moonPhase);
    const act = getActivityForYama(startAct, yama, moonPhase);
    if (act === Activity.RULE) {
      return bird;
    }
  }
  return Bird.VULTURE; 
};

// --- CORE CALCULATOR ---
const calculateSnapshot = (bird: Bird, date: Date, moonPhase: MoonPhase) => {
  const dayIndex = date.getDay();
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hour * 60 + minutes;

  let yama = 1;
  let dayTime = DayTime.DAY;

  // Standard 6 AM - 6 PM cycle
  const dayStart = 360; // 6:00 AM
  const dayEnd = 1080; // 6:00 PM
  const yamaDuration = 144; // 2h 24m

  if (totalMinutes >= dayStart && totalMinutes < dayEnd) {
    dayTime = DayTime.DAY;
    const minsSinceStart = totalMinutes - dayStart;
    yama = Math.min(Math.floor(minsSinceStart / yamaDuration) + 1, 5);
  } else {
    dayTime = DayTime.NIGHT;
    let minsSinceStart = 0;
    if (totalMinutes >= dayEnd) {
      minsSinceStart = totalMinutes - dayEnd;
    } else {
      minsSinceStart = totalMinutes + (1440 - dayEnd); 
    }
    yama = Math.min(Math.floor(minsSinceStart / yamaDuration) + 1, 5);
  }

  // Get Ruling Bird
  const rulingBird = getRulingBirdForYama(dayIndex, dayTime === DayTime.NIGHT, moonPhase, yama);
  
  // Get Subject Activity
  const startAct = getStartActivity(bird, dayIndex, dayTime === DayTime.NIGHT, moonPhase);
  const currentAct = getActivityForYama(startAct, yama, moonPhase);
  
  // Base Power
  let power = activityPower[currentAct];

  // Relationship Modifiers
  const relation = getBirdRelationship(bird, rulingBird, moonPhase);
  
  if (relation === BirdRelation.SELF) {
    power += 20; 
  } else if (relation === BirdRelation.FRIEND) {
    power += 10; 
  } else if (relation === BirdRelation.ENEMY) {
    power -= 10; 
  }

  return { activity: currentAct, power, yama, dayTime, rulingBird, relation };
};

// --- MATCH FLOW GENERATOR ---
const generateMatchFlow = (
  birdA: Bird, birdB: Bird, 
  startDate: Date, moonPhase: MoonPhase, 
  format: MatchFormat, 
  teamA: string, teamB: string
): FlowPoint[] => {
  const flow: FlowPoint[] = [];
  const durationMinutes = format === MatchFormat.T20 ? 240 : 480; 
  const interval = 30; 

  for (let m = 0; m <= durationMinutes; m += interval) {
    const pointTime = new Date(startDate.getTime() + m * 60000);
    const snapA = calculateSnapshot(birdA, pointTime, moonPhase);
    const snapB = calculateSnapshot(birdB, pointTime, moonPhase);

    let dominant = 'Draw';
    if (snapA.power > snapB.power) dominant = teamA;
    if (snapB.power > snapA.power) dominant = teamB;

    flow.push({
      time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      teamA_Power: snapA.power,
      teamB_Power: snapB.power,
      dominantTeam: dominant,
      activityA: snapA.activity,
      activityB: snapB.activity
    });
  }
  return flow;
};

// --- MAIN PREDICTION ---
export const calculatePrediction = (
  teamA: string, teamB: string, 
  captainA: PlayerDetails, captainB: PlayerDetails,
  date: Date, tossDate: Date, 
  moonPhase: MoonPhase,
  matchFormat: MatchFormat
): PredictionState => {
  
  const birdA = getBird(captainA, moonPhase);
  const birdB = getBird(captainB, moonPhase);

  // Match Prediction
  const matchSnapA = calculateSnapshot(birdA, date, moonPhase);
  const matchSnapB = calculateSnapshot(birdB, date, moonPhase);

  // Toss Prediction
  const tossSnapA = calculateSnapshot(birdA, tossDate, moonPhase);
  const tossSnapB = calculateSnapshot(birdB, tossDate, moonPhase);
  
  let tossWinner = 'Draw';
  if (tossSnapA.power > tossSnapB.power) tossWinner = teamA;
  else if (tossSnapB.power > tossSnapA.power) tossWinner = teamB;
  else {
    tossWinner = birdsOrder.indexOf(birdA) < birdsOrder.indexOf(birdB) ? teamA : teamB;
  }

  // Match Winner
  let winner = 'Draw';
  if (matchSnapA.power > matchSnapB.power) winner = teamA;
  if (matchSnapB.power > matchSnapA.power) winner = teamB;
  
  const dayIndex = date.getDay();
  const matchFlow = generateMatchFlow(birdA, birdB, date, moonPhase, matchFormat, teamA, teamB);

  return {
    teamA, teamB, captainA, captainB, birdA, birdB,
    activityA: matchSnapA.activity,
    activityB: matchSnapB.activity,
    winner,
    winProbability: Math.abs(matchSnapA.power - matchSnapB.power) > 0 ? 60 + Math.abs(matchSnapA.power - matchSnapB.power)/5 : 50,
    timeSlot: matchSnapA.yama,
    dayTime: matchSnapA.dayTime,
    moonPhase,
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
    birdColorA: getBirdColor(birdA, moonPhase),
    birdColorB: getBirdColor(birdB, moonPhase),
    rulingBird: matchSnapA.rulingBird,
    tossWinner,
    tossActivityA: tossSnapA.activity,
    tossActivityB: tossSnapB.activity,
    matchFlow,
    matchFormat,
    relationA: matchSnapA.relation,
    relationB: matchSnapB.relation,
    tossRelationA: tossSnapA.relation,
    tossRelationB: tossSnapB.relation,
  };
};

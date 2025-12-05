import { Bird, Activity, MoonPhase, DayTime, PlayerDetails, PredictionState, MatchFormat, FlowPoint, BirdRelation, GeoLocation } from '../types';

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

// --- ASTRONOMICAL CALCULATIONS (SERVER-GRADE) ---
const toRadians = (deg: number) => deg * Math.PI / 180;
const toDegrees = (rad: number) => rad * 180 / Math.PI;

const getSunTimes = (date: Date, lat: number, lng: number) => {
  // Day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Fractional year
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (12 - 12) / 24);

  // Equation of time
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));

  // Solar declination
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  // Hour angle
  const haRad = Math.acos(Math.cos(toRadians(90.833)) / (Math.cos(toRadians(lat)) * Math.cos(decl)) - Math.tan(toRadians(lat)) * Math.tan(decl));
  const haDeg = toDegrees(haRad);

  // Sunrise/Sunset (UTC minutes)
  const sunriseUTC = 720 - 4 * (lng + haDeg) - eqTime;
  const sunsetUTC = 720 - 4 * (lng - haDeg) - eqTime;

  // Convert to local time minutes (Approximate based on Timezone offset from date)
  const offset = -date.getTimezoneOffset(); // in minutes
  
  return {
    sunrise: (sunriseUTC + offset + 1440) % 1440,
    sunset: (sunsetUTC + offset + 1440) % 1440
  };
};

const formatTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// --- CORE CALCULATOR ---
const calculateSnapshot = (bird: Bird, date: Date, moonPhase: MoonPhase, lat: number, lng: number) => {
  const dayIndex = date.getDay();
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const currentTotalMinutes = hour * 60 + minutes;

  // Calculate Precise Sun Times for this Location
  const { sunrise, sunset } = getSunTimes(date, lat, lng);
  
  // Calculate Durations
  let dayDuration = 0;
  if (sunset >= sunrise) {
      dayDuration = sunset - sunrise;
  } else {
      // Unusual case, fallback
      dayDuration = (1440 - sunrise) + sunset;
  }
  
  const nightDuration = 1440 - dayDuration;
  const dayYamaDuration = dayDuration / 5;
  const nightYamaDuration = nightDuration / 5;

  let yama = 1;
  let dayTime = DayTime.DAY;

  // Determine if Day or Night
  if (currentTotalMinutes >= sunrise && currentTotalMinutes < sunset) {
    dayTime = DayTime.DAY;
    const minsSinceSunrise = currentTotalMinutes - sunrise;
    yama = Math.floor(minsSinceSunrise / dayYamaDuration) + 1;
  } else {
    dayTime = DayTime.NIGHT;
    let minsSinceSunset = 0;
    if (currentTotalMinutes >= sunset) {
      minsSinceSunset = currentTotalMinutes - sunset;
    } else {
      minsSinceSunset = (1440 - sunset) + currentTotalMinutes;
    }
    yama = Math.floor(minsSinceSunset / nightYamaDuration) + 1;
  }
  
  // Cap Yama at 5 (rounding errors)
  yama = Math.min(Math.max(yama, 1), 5);

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

  return { activity: currentAct, power, yama, dayTime, rulingBird, relation, sunrise, sunset };
};

// --- MATCH FLOW GENERATOR ---
const generateMatchFlow = (
  birdA: Bird, birdB: Bird, 
  startDate: Date, moonPhase: MoonPhase, 
  format: MatchFormat, 
  teamA: string, teamB: string,
  lat: number, lng: number
): FlowPoint[] => {
  const flow: FlowPoint[] = [];
  const durationMinutes = format === MatchFormat.T20 ? 240 : 480; 
  const interval = 30; 

  for (let m = 0; m <= durationMinutes; m += interval) {
    const pointTime = new Date(startDate.getTime() + m * 60000);
    const snapA = calculateSnapshot(birdA, pointTime, moonPhase, lat, lng);
    const snapB = calculateSnapshot(birdB, pointTime, moonPhase, lat, lng);

    let dominant = 'Draw';
    let pA = snapA.power;
    let pB = snapB.power;

    // Ruling Bird Dominance Logic
    if (snapA.rulingBird === birdA && snapB.rulingBird !== birdB) pA += 30; 
    if (snapB.rulingBird === birdB && snapA.rulingBird !== birdA) pB += 30;

    // Tie-breaker
    if (Math.abs(pA - pB) < 5) {
        const actRank = { [Activity.RULE]: 5, [Activity.EAT]: 4, [Activity.WALK]: 3, [Activity.SLEEP]: 2, [Activity.DIE]: 1 };
        if (actRank[snapA.activity] > actRank[snapB.activity]) pA += 1;
        if (actRank[snapB.activity] > actRank[snapA.activity]) pB += 1;
    }

    if (pA > pB) dominant = teamA;
    if (pB > pA) dominant = teamB;

    flow.push({
      time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      teamA_Power: pA,
      teamB_Power: pB,
      dominantTeam: dominant,
      activityA: snapA.activity,
      activityB: snapB.activity
    });
  }
  return flow;
};

// --- BIRD MAPPING HELPERS ---
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

const getBirdByStar = (starIndex: number, phase: MoonPhase): Bird => {
  const groups = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25, 26]
  ];
  if (phase === MoonPhase.WAXING) {
    if (groups[0].includes(starIndex)) return Bird.VULTURE;
    if (groups[1].includes(starIndex)) return Bird.OWL;
    if (groups[2].includes(starIndex)) return Bird.CROW;
    if (groups[3].includes(starIndex)) return Bird.COCK;
    if (groups[4].includes(starIndex)) return Bird.PEACOCK;
  } else {
    if (groups[4].includes(starIndex)) return Bird.VULTURE; 
    if (groups[3].includes(starIndex)) return Bird.OWL;     
    if (groups[2].includes(starIndex)) return Bird.CROW;    
    if (groups[1].includes(starIndex)) return Bird.COCK;    
    if (groups[0].includes(starIndex)) return Bird.PEACOCK; 
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

export const getBirdColor = (bird: Bird, phase: MoonPhase): string => {
  if (phase === MoonPhase.WAXING) {
    switch(bird) {
      case Bird.VULTURE: return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
      case Bird.OWL: return "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]";
      case Bird.CROW: return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
      case Bird.COCK: return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
      case Bird.PEACOCK: return "text-gray-900 bg-slate-200 px-1 rounded shadow-inner";
    }
  } else {
    switch(bird) {
      case Bird.VULTURE: return "text-gray-900 bg-slate-200 px-1 rounded shadow-inner";
      case Bird.OWL: return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
      case Bird.CROW: return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
      case Bird.COCK: return "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]";
      case Bird.PEACOCK: return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
    }
  }
  return "text-gray-200";
};

// ... Start Activity Tables (Same as before, ensuring strict book compliance) ...
const getStartSequence = (bird: Bird, isNight: boolean, phase: MoonPhase): Activity[] => {
  const { RULE, EAT, WALK, SLEEP, DIE } = Activity;
  const { VULTURE, OWL, CROW, COCK, PEACOCK } = Bird;
  if (phase === MoonPhase.WAXING) {
    if (!isNight) {
      if (bird === VULTURE) return [EAT, DIE, EAT, DIE, SLEEP, RULE, WALK];
      if (bird === OWL)     return [WALK, EAT, WALK, EAT, DIE, SLEEP, RULE];
      if (bird === CROW)    return [RULE, WALK, RULE, WALK, EAT, DIE, SLEEP];
      if (bird === COCK)    return [SLEEP, RULE, SLEEP, RULE, WALK, EAT, DIE];
      if (bird === PEACOCK) return [DIE, SLEEP, DIE, SLEEP, RULE, WALK, EAT];
    } else {
      if (bird === VULTURE) return [DIE, WALK, DIE, WALK, SLEEP, EAT, RULE];
      if (bird === OWL)     return [RULE, DIE, RULE, DIE, WALK, SLEEP, EAT];
      if (bird === CROW)    return [EAT, RULE, EAT, RULE, DIE, WALK, SLEEP];
      if (bird === COCK)    return [SLEEP, EAT, SLEEP, EAT, RULE, DIE, WALK];
      if (bird === PEACOCK) return [WALK, SLEEP, WALK, SLEEP, EAT, RULE, DIE];
    }
  } else {
    if (!isNight) {
      if (bird === VULTURE) return [WALK, SLEEP, WALK, DIE, RULE, EAT, SLEEP];
      if (bird === OWL)     return [DIE, WALK, DIE, RULE, EAT, DIE, WALK];
      if (bird === CROW)    return [RULE, DIE, RULE, EAT, WALK, SLEEP, DIE];
      if (bird === COCK)    return [EAT, RULE, EAT, SLEEP, DIE, WALK, RULE];
      if (bird === PEACOCK) return [SLEEP, EAT, SLEEP, WALK, SLEEP, RULE, EAT];
    } else {
      if (bird === VULTURE) return [EAT, WALK, EAT, WALK, SLEEP, DIE, RULE];
      if (bird === OWL)     return [EAT, WALK, EAT, WALK, SLEEP, DIE, RULE];
      if (bird === CROW)    return [RULE, SLEEP, RULE, SLEEP, EAT, WALK, SLEEP];
      if (bird === COCK)    return [SLEEP, EAT, SLEEP, EAT, RULE, DIE, WALK];
      if (bird === PEACOCK) return [DIE, RULE, DIE, RULE, WALK, SLEEP, EAT];
    }
  }
  return [RULE, RULE, RULE, RULE, RULE, RULE, RULE];
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

// --- EXPORT ---
export const calculatePrediction = (
  teamA: string, teamB: string, 
  captainA: PlayerDetails, captainB: PlayerDetails,
  date: Date, tossDate: Date, 
  moonPhase: MoonPhase,
  matchFormat: MatchFormat,
  location: GeoLocation
): PredictionState => {
  
  const birdA = getBird(captainA, moonPhase);
  const birdB = getBird(captainB, moonPhase);

  const matchSnapA = calculateSnapshot(birdA, date, moonPhase, location.lat, location.lng);
  const matchSnapB = calculateSnapshot(birdB, date, moonPhase, location.lat, location.lng);

  const tossSnapA = calculateSnapshot(birdA, tossDate, moonPhase, location.lat, location.lng);
  const tossSnapB = calculateSnapshot(birdB, tossDate, moonPhase, location.lat, location.lng);
  
  let tossWinner = 'Draw';
  if (tossSnapA.power > tossSnapB.power) tossWinner = teamA;
  else if (tossSnapB.power > tossSnapA.power) tossWinner = teamB;
  else {
    tossWinner = birdsOrder.indexOf(birdA) < birdsOrder.indexOf(birdB) ? teamA : teamB;
  }

  let winner = 'Draw';
  if (matchSnapA.power > matchSnapB.power) winner = teamA;
  if (matchSnapB.power > matchSnapA.power) winner = teamB;
  
  const dayIndex = date.getDay();
  const matchFlow = generateMatchFlow(birdA, birdB, date, moonPhase, matchFormat, teamA, teamB, location.lat, location.lng);

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
    location: `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`,
    sunrise: formatTime(matchSnapA.sunrise),
    sunset: formatTime(matchSnapA.sunset)
  };
};
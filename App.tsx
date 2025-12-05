import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Sparkles, Send, Info, RefreshCw, Moon, Sun, Crown, Coins, Search, Trophy, TrendingUp, Locate, ExternalLink, Save, Upload, X, Trash2, Users, FolderOpen, PlusCircle } from 'lucide-react';
import { calculatePrediction, NAKSHATRAS, getBirdColor, calculateNakshatra, getBird } from './utils/panchaPakshi';
import { PredictionState, ChatMessage, MoonPhase, Bird, Activity, MatchFormat, GeoLocation, TeamProfile } from './types';
import { ResultCard } from './components/ResultCard';
import { getAstrologicalInsight, chatWithAstrologer } from './services/geminiService';
import { BirdIcon, ActivityIcon } from './components/BirdIcon';

const MAJOR_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Mumbai", lat: 19.07, lng: 72.87 },
  { name: "Chennai", lat: 13.08, lng: 80.27 },
  { name: "Bangalore", lat: 12.97, lng: 77.59 },
  { name: "Kolkata", lat: 22.57, lng: 88.36 },
  { name: "Delhi", lat: 28.70, lng: 77.10 },
  { name: "Hyderabad", lat: 17.38, lng: 78.48 },
  { name: "Ahmedabad", lat: 23.02, lng: 72.57 },
  { name: "Pune", lat: 18.52, lng: 73.85 },
  { name: "Jaipur", lat: 26.91, lng: 75.78 },
  { name: "Lucknow", lat: 26.84, lng: 80.94 },
  { name: "London", lat: 51.50, lng: -0.12 },
  { name: "Manchester", lat: 53.48, lng: -2.24 },
  { name: "Birmingham", lat: 52.48, lng: -1.89 },
  { name: "Sydney", lat: -33.86, lng: 151.20 },
  { name: "Melbourne", lat: -37.81, lng: 144.96 },
  { name: "Perth", lat: -31.95, lng: 115.86 },
  { name: "Dubai", lat: 25.20, lng: 55.27 },
  { name: "Sharjah", lat: 25.35, lng: 55.40 },
  { name: "Colombo", lat: 6.92, lng: 79.86 },
  { name: "Karachi", lat: 24.86, lng: 67.00 },
  { name: "Lahore", lat: 31.52, lng: 74.35 }
];

interface SavedMatchData {
  id: string;
  name: string;
  timestamp: number;
  data: {
    teamA: string;
    teamB: string;
    captainA: string;
    captainB: string;
    dobA: string;
    dobB: string;
    starA: string;
    starB: string;
    date: string;
    time: string;
    tossTime: string;
    moonPhase: MoonPhase;
    matchFormat: MatchFormat;
    locationQuery: string;
    selectedLocation: GeoLocation;
  };
}

const App = () => {
  // Inputs
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  
  const [captainA, setCaptainA] = useState('');
  const [dobA, setDobA] = useState('');
  const [starA, setStarA] = useState('');
  
  const [captainB, setCaptainB] = useState('');
  const [dobB, setDobB] = useState('');
  const [starB, setStarB] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));
  const [tossTime, setTossTime] = useState(''); 
  const [moonPhase, setMoonPhase] = useState<MoonPhase>(MoonPhase.WAXING);
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(MatchFormat.T20);

  // Location
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>({ lat: 19.07, lng: 72.87 }); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  // Live Previews
  const [previewBirdA, setPreviewBirdA] = useState<Bird | null>(null);
  const [previewBirdB, setPreviewBirdB] = useState<Bird | null>(null);

  // Outputs
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Match Save/Load Logic
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedMatches, setSavedMatches] = useState<SavedMatchData[]>([]);

  // Team Library Logic
  const [savedTeams, setSavedTeams] = useState<TeamProfile[]>([]);
  const [showTeamModal, setShowTeamModal] = useState<'A' | 'B' | null>(null);

  // Load Saved Teams on Mount
  useEffect(() => {
    const loadedTeams = localStorage.getItem('pp_team_library');
    if (loadedTeams) {
        setSavedTeams(JSON.parse(loadedTeams));
    }
  }, []);

  // Auto-Calculate Star from DOB
  useEffect(() => {
    if (dobA) {
        const calculatedStar = calculateNakshatra(dobA);
        if (calculatedStar) setStarA(calculatedStar);
    }
  }, [dobA]);

  useEffect(() => {
    if (dobB) {
        const calculatedStar = calculateNakshatra(dobB);
        if (calculatedStar) setStarB(calculatedStar);
    }
  }, [dobB]);

  // Real-time Bird Calculation
  useEffect(() => {
    const bird = getBird({ name: captainA, dob: dobA, star: starA }, moonPhase);
    setPreviewBirdA(bird);
  }, [captainA, starA, moonPhase]);

  useEffect(() => {
    const bird = getBird({ name: captainB, dob: dobB, star: starB }, moonPhase);
    setPreviewBirdB(bird);
  }, [captainB, starB, moonPhase]);

  // Auto-set Toss Time
  useEffect(() => {
    if (time && !tossTime) {
        const [h, m] = time.split(':').map(Number);
        const matchDate = new Date();
        matchDate.setHours(h, m);
        matchDate.setMinutes(matchDate.getMinutes() - 30);
        const tossH = matchDate.getHours().toString().padStart(2, '0');
        const tossM = matchDate.getMinutes().toString().padStart(2, '0');
        setTossTime(`${tossH}:${tossM}`);
    }
  }, [time]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (cityData: {name: string, lat: number, lng: number}) => {
    setLocationQuery(cityData.name);
    setSelectedLocation({ lat: cityData.lat, lng: cityData.lng });
    setShowSuggestions(false);
  };

  const handleUseCurrentLocation = () => {
    setLocationQuery("Fetching...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocationQuery(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        setSelectedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {
        setLocationQuery("Location access denied");
      });
    }
  };

  const handlePredict = () => {
    if (!teamA || !teamB) return;
    const dateTime = new Date(`${date}T${time}`);
    const tossDateTime = new Date(`${date}T${tossTime}`);
    
    // Pass selectedLocation to calculation (Drik Panchang Server Logic)
    const result = calculatePrediction(
        teamA, teamB, 
        { name: captainA || teamA, dob: dobA, star: starA },
        { name: captainB || teamB, dob: dobB, star: starB },
        dateTime, tossDateTime, moonPhase, matchFormat,
        selectedLocation
    );
    setPrediction(result);
    setAiInsight('');
  };

  // --- SAVE / LOAD MATCH SYSTEM ---

  const handleSaveMatch = () => {
    if (!teamA || !teamB) {
        alert("Please enter Team names before saving.");
        return;
    }

    const matchData = {
      teamA, teamB, captainA, captainB, dobA, dobB, starA, starB,
      date, time, tossTime, moonPhase, matchFormat, locationQuery, selectedLocation
    };

    const newSavedMatch: SavedMatchData = {
        id: Date.now().toString(),
        name: `${teamA} vs ${teamB}`,
        timestamp: Date.now(),
        data: matchData
    };

    const existingData = localStorage.getItem('pp_saved_matches');
    const matches: SavedMatchData[] = existingData ? JSON.parse(existingData) : [];
    
    const updatedMatches = [newSavedMatch, ...matches];
    localStorage.setItem('pp_saved_matches', JSON.stringify(updatedMatches));
    
    alert('Match details saved to list!');
  };

  const handleLoadMatch = () => {
    const existingData = localStorage.getItem('pp_saved_matches');
    if (existingData) {
        const matches: SavedMatchData[] = JSON.parse(existingData);
        if (matches.length > 0) {
            setSavedMatches(matches);
            setShowLoadModal(true);
        } else {
            alert('No saved matches found.');
        }
    } else {
        alert('No saved matches found.');
    }
  };

  const handleSelectMatch = (match: SavedMatchData) => {
      const { data } = match;
      setTeamA(data.teamA || '');
      setTeamB(data.teamB || '');
      setCaptainA(data.captainA || '');
      setCaptainB(data.captainB || '');
      setDobA(data.dobA || '');
      setDobB(data.dobB || '');
      setStarA(data.starA || '');
      setStarB(data.starB || '');
      setDate(data.date || '');
      setTime(data.time || '');
      setTossTime(data.tossTime || '');
      setMoonPhase(data.moonPhase || MoonPhase.WAXING);
      setMatchFormat(data.matchFormat || MatchFormat.T20);
      setLocationQuery(data.locationQuery || '');
      if (data.selectedLocation) setSelectedLocation(data.selectedLocation);
      
      setShowLoadModal(false);
      setPrediction(null); 
      setAiInsight('');
  };

  const handleDeleteMatch = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      const updated = savedMatches.filter(m => m.id !== id);
      setSavedMatches(updated);
      localStorage.setItem('pp_saved_matches', JSON.stringify(updated));
  };

  // --- SAVE / LOAD TEAM PROFILE SYSTEM ---

  const handleSaveTeam = (side: 'A' | 'B') => {
      const name = side === 'A' ? teamA : teamB;
      const captain = side === 'A' ? captainA : captainB;
      const dob = side === 'A' ? dobA : dobB;
      const star = side === 'A' ? starA : starB;

      if (!name) {
          alert("Enter Team Name to save.");
          return;
      }

      const newTeam: TeamProfile = {
          id: Date.now().toString(),
          name, captain, dob, star
      };

      const updatedTeams = [...savedTeams, newTeam];
      setSavedTeams(updatedTeams);
      localStorage.setItem('pp_team_library', JSON.stringify(updatedTeams));
      alert(`Team ${name} saved to library!`);
  };

  const handleSelectTeam = (team: TeamProfile, side: 'A' | 'B') => {
      if (side === 'A') {
          setTeamA(team.name);
          setCaptainA(team.captain);
          setDobA(team.dob);
          setStarA(team.star);
      } else {
          setTeamB(team.name);
          setCaptainB(team.captain);
          setDobB(team.dob);
          setStarB(team.star);
      }
      setShowTeamModal(null);
  };

  const handleDeleteTeam = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = savedTeams.filter(t => t.id !== id);
      setSavedTeams(updated);
      localStorage.setItem('pp_team_library', JSON.stringify(updated));
  };

  // --- AI Logic ---

  const handleGetInsight = async () => {
    if (!prediction) return;
    setLoadingAi(true);
    const text = await getAstrologicalInsight(prediction);
    setAiInsight(text);
    setLoadingAi(false);
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const newMsg: ChatMessage = { role: 'user', text: inputMsg, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setInputMsg('');
    setChatLoading(true);

    const context = prediction ? 
      `Context: ${prediction.matchFormat} Match ${prediction.teamA} vs ${prediction.teamB}. 
       Winner: ${prediction.winner}. Toss Winner: ${prediction.tossWinner}.
       Phase: ${prediction.moonPhase}. Location: ${locationQuery}.` 
      : "Context: No active prediction.";
    
    const historyForApi = [
        { role: 'user' as const, text: context },
        ...messages.map(m => ({ role: m.role, text: m.text }))
    ];

    const response = await chatWithAstrologer(historyForApi, newMsg.text);
    
    setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date() }]);
    setChatLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-mystic-gold selection:text-mystic-900 pb-20">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/90 border-b border-white/5 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-mystic-gold w-6 h-6 animate-pulse" />
            <h1 className="text-xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-purple-400">
              PANCHAPAKSHI
            </h1>
          </div>
          
          {/* Location Search */}
          <div className="relative w-full md:w-64" ref={locationRef}>
            <div className="flex items-center bg-black/30 border border-slate-700 rounded-full px-3 py-1.5 focus-within:border-mystic-gold transition-colors">
               <Search size={14} className="text-slate-500 mr-2"/>
               <input 
                  type="text" 
                  value={locationQuery}
                  onChange={(e) => { setLocationQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="City (e.g., Mumbai, London)"
                  className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-600"
               />
               <button onClick={handleUseCurrentLocation} title="Use Current Location" className="text-slate-500 hover:text-mystic-gold">
                  <Locate size={14} />
               </button>
            </div>
            {showSuggestions && (
                <div className="absolute top-full left-0 w-full mt-1 bg-mystic-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                    {MAJOR_CITIES.filter(c => c.name.toLowerCase().includes(locationQuery.toLowerCase())).map(city => (
                        <div 
                            key={city.name} 
                            onClick={() => handleLocationSelect(city)}
                            className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer flex justify-between"
                        >
                            <span>{city.name}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative">
        
        {/* Intro */}
        <section className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-serif text-white">Vedic Cricket Prediction</h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Ancient Pancha Pakshi Shastra for modern cricket analysis.
          </p>
        </section>

        {/* Input Form */}
        <section className="bg-mystic-800/50 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
             {/* Moon Phase Toggle */}
             <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Moon Phase</label>
                <div className="bg-mystic-900 p-1 rounded-xl flex border border-slate-700 w-full md:w-auto">
                    <button 
                    onClick={() => setMoonPhase(MoonPhase.WAXING)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${moonPhase === MoonPhase.WAXING ? 'bg-mystic-gold text-mystic-900 font-bold shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                    <Sun size={14} /> SHUKLA
                    </button>
                    <button 
                    onClick={() => setMoonPhase(MoonPhase.WANING)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${moonPhase === MoonPhase.WANING ? 'bg-purple-600 text-white font-bold shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                    <Moon size={14} /> KRISHNA
                    </button>
                </div>
             </div>

             {/* Match Format Toggle */}
             <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Match Format</label>
                <div className="bg-mystic-900 p-1 rounded-xl flex border border-slate-700 w-full md:w-auto">
                    <button 
                    onClick={() => setMatchFormat(MatchFormat.T20)}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs transition-all ${matchFormat === MatchFormat.T20 ? 'bg-blue-600 text-white font-bold shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                    T20
                    </button>
                    <button 
                    onClick={() => setMatchFormat(MatchFormat.ODI)}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs transition-all ${matchFormat === MatchFormat.ODI ? 'bg-indigo-600 text-white font-bold shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                    ODI
                    </button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Team A */}
            <div className="space-y-4 bg-mystic-900/30 p-4 rounded-xl border border-white/5 shadow-inner">
              <div className="flex justify-between items-center">
                  <h3 className="text-mystic-gold font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                     Team A
                  </h3>
                  <div className="flex gap-2">
                      <button onClick={() => setShowTeamModal('A')} title="Load Team" className="text-slate-400 hover:text-white">
                          <FolderOpen size={16} />
                      </button>
                      <button onClick={() => handleSaveTeam('A')} title="Save Team" className="text-slate-400 hover:text-mystic-gold">
                          <PlusCircle size={16} />
                      </button>
                  </div>
              </div>
              <div className="space-y-3">
                 <input 
                    type="text" placeholder="Team Name" value={teamA} onChange={(e) => setTeamA(e.target.value)}
                    className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-mystic-gold placeholder-slate-600"
                 />
                 <input 
                    type="text" placeholder="Captain Name" value={captainA} onChange={(e) => setCaptainA(e.target.value)}
                    className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-mystic-gold placeholder-slate-600"
                 />
                 <div className="grid grid-cols-2 gap-2">
                     <div className="relative group">
                         <label className="absolute -top-1.5 left-2 text-[8px] bg-mystic-900 px-1 text-slate-400">DOB</label>
                         <input 
                            type="date" value={dobA} onChange={(e) => setDobA(e.target.value)}
                            className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs outline-none focus:border-mystic-gold h-10"
                         />
                     </div>
                     <div className="relative">
                         <label className="absolute -top-1.5 left-2 text-[8px] bg-mystic-900 px-1 text-slate-400">Star</label>
                         <select 
                            value={starA} onChange={(e) => setStarA(e.target.value)}
                            className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs outline-none focus:border-mystic-gold h-10"
                         >
                            <option value="">Select Star</option>
                            {NAKSHATRAS.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                     </div>
                 </div>

                 {/* Team A Bird Box */}
                 <div className="mt-4 bg-black/40 border border-mystic-gold/20 rounded-lg p-3 flex flex-col items-center justify-center transition-all animate-fade-in relative group">
                    <span className="text-[10px] uppercase text-slate-500 mb-1">Bird</span>
                    {previewBirdA ? (
                         <div className={`flex items-center gap-2 ${getBirdColor(previewBirdA, moonPhase)}`}>
                             <BirdIcon bird={previewBirdA} size={20} />
                             <span className="font-bold">{previewBirdA.split(' ')[0]}</span>
                         </div>
                    ) : (
                        <span className="text-xs text-slate-600 italic">...</span>
                    )}
                    <a 
                      href="https://www.drikpanchang.com/panch-pakshi/panch-pakshi.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 text-slate-600 hover:text-mystic-gold opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Verify on Drik Panchang"
                    >
                      <ExternalLink size={10} />
                    </a>
                 </div>
              </div>
            </div>

            {/* Team B */}
            <div className="space-y-4 bg-mystic-900/30 p-4 rounded-xl border border-white/5 shadow-inner">
              <div className="flex justify-between items-center">
                  <h3 className="text-purple-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                     Team B
                  </h3>
                  <div className="flex gap-2">
                      <button onClick={() => setShowTeamModal('B')} title="Load Team" className="text-slate-400 hover:text-white">
                          <FolderOpen size={16} />
                      </button>
                      <button onClick={() => handleSaveTeam('B')} title="Save Team" className="text-slate-400 hover:text-purple-400">
                          <PlusCircle size={16} />
                      </button>
                  </div>
              </div>
              <div className="space-y-3">
                 <input 
                    type="text" placeholder="Team Name" value={teamB} onChange={(e) => setTeamB(e.target.value)}
                    className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-400 placeholder-slate-600"
                 />
                 <input 
                    type="text" placeholder="Captain Name" value={captainB} onChange={(e) => setCaptainB(e.target.value)}
                    className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-400 placeholder-slate-600"
                 />
                 <div className="grid grid-cols-2 gap-2">
                     <div className="relative group">
                         <label className="absolute -top-1.5 left-2 text-[8px] bg-mystic-900 px-1 text-slate-400">DOB</label>
                         <input 
                            type="date" value={dobB} onChange={(e) => setDobB(e.target.value)}
                            className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs outline-none focus:border-purple-400 h-10"
                         />
                     </div>
                     <div className="relative">
                         <label className="absolute -top-1.5 left-2 text-[8px] bg-mystic-900 px-1 text-slate-400">Star</label>
                         <select 
                            value={starB} onChange={(e) => setStarB(e.target.value)}
                            className="w-full bg-mystic-900 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs outline-none focus:border-purple-400 h-10"
                         >
                            <option value="">Select Star</option>
                            {NAKSHATRAS.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                     </div>
                 </div>

                 {/* Team B Bird Box */}
                 <div className="mt-4 bg-black/40 border border-purple-500/20 rounded-lg p-3 flex flex-col items-center justify-center transition-all animate-fade-in relative group">
                    <span className="text-[10px] uppercase text-slate-500 mb-1">Bird</span>
                    {previewBirdB ? (
                         <div className={`flex items-center gap-2 ${getBirdColor(previewBirdB, moonPhase)}`}>
                             <BirdIcon bird={previewBirdB} size={20} />
                             <span className="font-bold">{previewBirdB.split(' ')[0]}</span>
                         </div>
                    ) : (
                        <span className="text-xs text-slate-600 italic">...</span>
                    )}
                    <a 
                      href="https://www.drikpanchang.com/panch-pakshi/panch-pakshi.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 text-slate-600 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Verify on Drik Panchang"
                    >
                      <ExternalLink size={10} />
                    </a>
                 </div>
              </div>
            </div>
          </div>

          {/* Time and Date Section */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-black/20 p-4 rounded-xl">
             <div className="space-y-1 col-span-1">
                <label className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider"><Calendar size={12}/> Date</label>
                <input 
                    type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-700 p-2 text-sm text-slate-200 focus:border-mystic-gold outline-none"
                />
             </div>
             <div className="space-y-1 col-span-1">
                <label className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider text-mystic-gold font-bold"><Coins size={12}/> Toss Time</label>
                <input 
                    type="time" value={tossTime} onChange={(e) => setTossTime(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-700 p-2 text-sm text-mystic-gold focus:border-mystic-gold outline-none font-bold"
                />
             </div>
             <div className="space-y-1 col-span-1">
                <label className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider"><Clock size={12}/> Start Time</label>
                <input 
                    type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-700 p-2 text-sm text-slate-200 focus:border-mystic-gold outline-none"
                />
             </div>
          </div>

          <div className="flex gap-4">
             <button 
                onClick={handlePredict}
                className="flex-1 bg-gradient-to-r from-mystic-gold to-yellow-600 text-mystic-900 font-bold py-4 rounded-xl shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-lg font-serif"
              >
                <Sparkles size={20} /> CALCULATE PREDICTION
              </button>
              
              <button 
                onClick={handleSaveMatch}
                title="Save Match Details"
                className="bg-mystic-900 border border-slate-600 hover:border-mystic-gold text-slate-300 hover:text-mystic-gold rounded-xl px-4 py-2 transition-all flex items-center gap-2"
              >
                <Save size={20} />
              </button>
              
              <button 
                onClick={handleLoadMatch}
                title="Load Match from List"
                className="bg-mystic-900 border border-slate-600 hover:border-mystic-gold text-slate-300 hover:text-mystic-gold rounded-xl px-4 py-2 transition-all flex items-center gap-2"
              >
                <Upload size={20} />
              </button>
          </div>
        </section>

        {/* Saved Matches Modal */}
        {showLoadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-mystic-900 border border-slate-600 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-mystic-gold font-serif font-bold text-lg">Saved Matches</h3>
                        <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {savedMatches.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm py-8">No saved matches found</div>
                        ) : (
                            savedMatches.map((match) => (
                                <div 
                                    key={match.id} 
                                    className="bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl p-3 flex justify-between items-center group cursor-pointer transition-all"
                                    onClick={() => handleSelectMatch(match)}
                                >
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-200 text-sm">{match.name}</div>
                                        <div className="text-[10px] text-slate-500">{new Date(match.data.date).toLocaleDateString()} • {match.data.matchFormat}</div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteMatch(match.id, e)}
                                        className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Match"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Saved Teams Modal */}
        {showTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-mystic-900 border border-slate-600 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-mystic-gold font-serif font-bold text-lg flex items-center gap-2">
                            <Users size={18} /> Select Team {showTeamModal}
                        </h3>
                        <button onClick={() => setShowTeamModal(null)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {savedTeams.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm py-8">No saved teams. Save a team first!</div>
                        ) : (
                            savedTeams.map((team) => (
                                <div 
                                    key={team.id} 
                                    className="bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl p-3 flex justify-between items-center group cursor-pointer transition-all"
                                    onClick={() => handleSelectTeam(team, showTeamModal)}
                                >
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-200 text-sm">{team.name}</div>
                                        <div className="text-[10px] text-slate-500">Cap: {team.captain}</div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteTeam(team.id, e)}
                                        className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Team"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Results Display */}
        {prediction && (
          <section className="animate-fade-in space-y-6">
            
            {/* Live Ruling Bird Banner */}
            <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-full text-mystic-900">
                        <Crown size={20} />
                    </div>
                    <div>
                        <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                           Ruling Bird
                           <a 
                              href="https://www.drikpanchang.com/panch-pakshi/panch-pakshi.html" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors border border-emerald-500/30"
                              title="Verify on Drik Panchang Server"
                           >
                              <ExternalLink size={10} /> Drik Panchang
                           </a>
                        </h4>
                        <p className="text-xs text-emerald-200/70">Dominant Energy</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
                    <div className={`flex items-center gap-2 border-r border-white/10 pr-4 ${getBirdColor(prediction.rulingBird, prediction.moonPhase)}`}>
                        <BirdIcon bird={prediction.rulingBird} />
                        <span className="font-bold text-lg">{prediction.rulingBird.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <ActivityIcon activity={Activity.RULE} size={18} />
                         <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Rule</span>
                    </div>
                </div>
            </div>

            {/* Toss Winner Section */}
            <div className="bg-gradient-to-r from-mystic-800 to-slate-800 border border-slate-600 rounded-xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                   <div className="bg-amber-500/20 p-2 rounded-full text-amber-500 border border-amber-500/50">
                      <Coins size={20} />
                   </div>
                   <h4 className="text-slate-200 font-bold text-sm uppercase tracking-wider">Toss Winner</h4>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-amber-400 font-bold text-lg font-serif tracking-widest">
                     {prediction.tossWinner}
                  </div>
                  {/* Toss Relation Info */}
                  <div className="text-[10px] text-slate-500 mt-1">
                      {prediction.tossWinner === prediction.teamA 
                        ? (prediction.tossRelationA && <span className="text-green-400">{prediction.tossRelationA}</span>)
                        : (prediction.tossRelationB && <span className="text-green-400">{prediction.tossRelationB}</span>)
                      }
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-mystic-900 border-4 border-mystic-800 rounded-full w-14 h-14 flex items-center justify-center font-black text-slate-500 shadow-xl hidden md:flex text-xl">
                    VS
                </div>

                <div className={`relative ${prediction.birdColorA}`}>
                    {prediction.winner === prediction.teamA && (
                        <div className="absolute -top-3 -right-3 z-20 text-4xl drop-shadow-lg filter">🏆</div>
                    )}
                    <ResultCard 
                        teamName={prediction.teamA}
                        bird={prediction.birdA}
                        activity={prediction.activityA}
                        relation={prediction.relationA}
                        isWinner={prediction.winner === prediction.teamA}
                        isDraw={prediction.winner === 'Draw'}
                    />
                </div>
                
                <div className={`relative ${prediction.birdColorB}`}>
                    {prediction.winner === prediction.teamB && (
                        <div className="absolute -top-3 -right-3 z-20 text-4xl drop-shadow-lg filter">🏆</div>
                    )}
                    <ResultCard 
                        teamName={prediction.teamB}
                        bird={prediction.birdB}
                        activity={prediction.activityB}
                        relation={prediction.relationB}
                        isWinner={prediction.winner === prediction.teamB}
                        isDraw={prediction.winner === 'Draw'}
                    />
                </div>
            </div>

            {/* Show Calculated Sun Times in Results if Prediction Exists */}
             {prediction && (
                 <div className="flex justify-center gap-6 text-[10px] text-slate-500 mt-2">
                     <span className="flex items-center gap-1"><Sun size={10} /> Sunrise: {prediction.sunrise}</span>
                     <span className="flex items-center gap-1"><Moon size={10} /> Sunset: {prediction.sunset}</span>
                 </div>
             )}

            {/* Match Flow Timeline */}
            <div className="bg-mystic-900/50 border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-mystic-gold font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                       <TrendingUp size={16} /> Match Flow ({prediction.matchFormat})
                    </h3>
                    <a 
                      href="https://www.drikpanchang.com/panch-pakshi/panch-pakshi.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-mystic-gold transition-colors"
                    >
                      Verify Timeline <ExternalLink size={10} />
                    </a>
                </div>
                <div className="relative border-l-2 border-slate-700 ml-4 space-y-6">
                   {prediction.matchFlow.map((point, index) => (
                      <div key={index} className="relative pl-6">
                         <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${point.dominantTeam === prediction.teamA ? 'bg-mystic-gold' : point.dominantTeam === prediction.teamB ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                         <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg hover:bg-black/40 transition-colors">
                            <span className="text-xs font-mono text-slate-400">{point.time}</span>
                            <div className="flex items-center gap-2">
                               <span className={`text-xs font-bold ${point.dominantTeam === prediction.teamA ? 'text-mystic-gold' : point.dominantTeam === prediction.teamB ? 'text-purple-400' : 'text-slate-500'}`}>
                                  {point.dominantTeam} Dominates
                               </span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
            </div>

            {/* AI Insight Section */}
            <div className="bg-gradient-to-b from-purple-900/20 to-mystic-900 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg text-purple-200 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400"/> Astrologer's Insight
                    </h3>
                    <button 
                        onClick={handleGetInsight}
                        disabled={loadingAi}
                        className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                        {loadingAi ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                        {aiInsight ? 'Refresh' : 'Reveal Destiny'}
                    </button>
                </div>
                
                {aiInsight ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-slate-300 leading-relaxed italic border-l-2 border-purple-500/50 pl-4">
                            "{aiInsight}"
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-600 text-sm">
                        Tap "Reveal Destiny" to ask the AI Astrologer for interpretation.
                    </div>
                )}
            </div>

          </section>
        )}
      </main>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="bg-mystic-gold hover:bg-yellow-400 text-mystic-900 rounded-full p-4 shadow-xl shadow-yellow-500/20 transition-all hover:scale-110 active:scale-95"
        >
            {chatOpen ? <span className="font-bold text-xl">×</span> : <div className="flex items-center gap-2 font-bold"><Info size={24}/></div>}
        </button>
      </div>

      {/* Chat Interface */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-mystic-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="p-4 bg-mystic-900 border-b border-white/5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="font-serif text-sm font-bold text-slate-200">Guru AI</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-xs text-slate-500 mt-10">
                        Ask me about lucky colors, player fate, or match timings...
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {chatLoading && (
                    <div className="flex justify-start">
                         <div className="bg-slate-700 rounded-2xl px-4 py-2 rounded-bl-none flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-mystic-900 border-t border-white/5">
                <div className="relative">
                    <input 
                        type="text" 
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder="Ask the stars..."
                        className="w-full bg-slate-800 rounded-full pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-mystic-gold"
                    />
                    <button 
                        onClick={handleSendChat}
                        disabled={chatLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-mystic-gold hover:text-white disabled:opacity-50 p-1"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;
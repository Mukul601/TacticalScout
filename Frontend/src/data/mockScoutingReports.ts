import { ScoutingReport } from "@/types/scouting";

export const mockScoutingReports: Record<string, ScoutingReport> = {
  "Team Liquid": {
    teamName: "Team Liquid",
    record: { wins: 24, losses: 8 },
    winRate: 75,
    avgGameTime: "32:14",
    players: [
      { name: "CoreJJ", role: "Support", kda: "2.8/1.2/14.5", winRate: 68, tendency: "defensive", championPool: ["Nautilus", "Thresh", "Leona"] },
      { name: "Yeon", role: "ADC", kda: "8.2/2.1/6.3", winRate: 62, tendency: "aggressive", championPool: ["Jinx", "Aphelios", "Kai'Sa"] },
      { name: "APA", role: "Mid", kda: "6.5/2.8/7.1", winRate: 71, tendency: "aggressive", championPool: ["Azir", "Syndra", "Ahri"] },
      { name: "Summit", role: "Top", kda: "4.2/3.1/5.8", winRate: 58, tendency: "balanced", championPool: ["Jayce", "Gnar", "Renekton"] },
      { name: "UmTi", role: "Jungle", kda: "3.8/2.4/9.2", winRate: 65, tendency: "aggressive", championPool: ["Lee Sin", "Viego", "Sejuani"] },
    ],
    recentMatches: [
      { result: "W", opponent: "Cloud9", score: "2-1", duration: "34:22" },
      { result: "W", opponent: "100T", score: "2-0", duration: "28:15" },
      { result: "L", opponent: "FlyQuest", score: "1-2", duration: "41:08" },
      { result: "W", opponent: "TSM", score: "2-0", duration: "29:44" },
      { result: "W", opponent: "EG", score: "2-1", duration: "35:17" },
    ],
    strengths: [
      { area: "Early Game", rating: 82, trend: "up" },
      { area: "Team Fighting", rating: 78, trend: "stable" },
      { area: "Vision Control", rating: 91, trend: "up" },
      { area: "Objective Control", rating: 74, trend: "down" },
    ],
    counterStrategies: [
      { id: "cs1", title: "Target Bot Lane Early", description: "CoreJJ roams frequently pre-6. Punish Yeon's isolated positioning with jungle pressure.", effectiveness: "high", phase: "early" },
      { id: "cs2", title: "Contest Dragon Soul", description: "TL tends to trade objectives. Force 50/50 fights at Dragon to disrupt their scaling comp.", effectiveness: "medium", phase: "mid" },
      { id: "cs3", title: "Split Push Pressure", description: "Summit struggles in 1v1 late game. Apply side lane pressure to prevent 5v5 team fights.", effectiveness: "high", phase: "late" },
      { id: "cs4", title: "Ban Azir/Jinx", description: "APA's Azir win rate is 78%. Yeon's Jinx is their primary late-game insurance.", effectiveness: "high", phase: "early" },
    ],
    draftRisks: [
      { champion: "Azir", role: "Mid", threat: "ban", priority: 95, notes: "APA's signature pick - 78% WR" },
      { champion: "Nautilus", role: "Support", threat: "ban", priority: 88, notes: "CoreJJ engage threat" },
      { champion: "Lee Sin", role: "Jungle", threat: "pick", priority: 72, notes: "UmTi early game playmaker" },
      { champion: "Jinx", role: "ADC", threat: "pick", priority: 85, notes: "Yeon comfort + late scaling" },
      { champion: "Jayce", role: "Top", threat: "flex", priority: 65, notes: "Summit/APA flex threat" },
    ],
    lastUpdated: new Date().toISOString(),
  },
  "Cloud9": {
    teamName: "Cloud9",
    record: { wins: 20, losses: 12 },
    winRate: 62,
    avgGameTime: "29:45",
    players: [
      { name: "Vulcan", role: "Support", kda: "1.9/2.1/12.8", winRate: 61, tendency: "aggressive", championPool: ["Rakan", "Alistar", "Renata"] },
      { name: "Berserker", role: "ADC", kda: "9.1/2.4/5.2", winRate: 68, tendency: "aggressive", championPool: ["Zeri", "Lucian", "Draven"] },
      { name: "Emenes", role: "Mid", kda: "5.8/2.9/6.4", winRate: 58, tendency: "balanced", championPool: ["Viktor", "Orianna", "Taliyah"] },
      { name: "Fudge", role: "Top", kda: "3.5/2.8/4.9", winRate: 55, tendency: "defensive", championPool: ["Ornn", "K'Sante", "Sion"] },
      { name: "Blaber", role: "Jungle", kda: "4.2/3.2/8.1", winRate: 64, tendency: "aggressive", championPool: ["Kindred", "Graves", "Olaf"] },
    ],
    recentMatches: [
      { result: "L", opponent: "Team Liquid", score: "1-2", duration: "34:22" },
      { result: "W", opponent: "TSM", score: "2-0", duration: "26:18" },
      { result: "W", opponent: "Dignitas", score: "2-1", duration: "33:41" },
      { result: "L", opponent: "FlyQuest", score: "0-2", duration: "28:55" },
      { result: "W", opponent: "CLG", score: "2-0", duration: "27:33" },
    ],
    strengths: [
      { area: "Early Game", rating: 88, trend: "up" },
      { area: "Team Fighting", rating: 65, trend: "down" },
      { area: "Vision Control", rating: 72, trend: "stable" },
      { area: "Objective Control", rating: 81, trend: "up" },
    ],
    counterStrategies: [
      { id: "cs1", title: "Scale and Team Fight", description: "C9 excels at early skirmishes but struggles in coordinated 5v5. Draft scaling and survive early.", effectiveness: "high", phase: "late" },
      { id: "cs2", title: "Shut Down Berserker", description: "Berserker is their primary carry. Focus resources on neutralizing bot lane advantage.", effectiveness: "high", phase: "early" },
      { id: "cs3", title: "Invade Blaber", description: "Track Blaber's aggressive pathing. Counter-jungle when he shows on opposite side.", effectiveness: "medium", phase: "early" },
    ],
    draftRisks: [
      { champion: "Zeri", role: "ADC", threat: "ban", priority: 92, notes: "Berserker's best champion" },
      { champion: "Kindred", role: "Jungle", threat: "pick", priority: 78, notes: "Blaber's comfort pick" },
      { champion: "Rakan", role: "Support", threat: "ban", priority: 70, notes: "Vulcan engage enabler" },
    ],
    lastUpdated: new Date().toISOString(),
  },
  "FlyQuest": {
    teamName: "FlyQuest",
    record: { wins: 22, losses: 10 },
    winRate: 69,
    avgGameTime: "31:20",
    players: [
      { name: "Busio", role: "Support", kda: "2.1/1.8/13.2", winRate: 70, tendency: "balanced", championPool: ["Thresh", "Braum", "Lulu"] },
      { name: "Massu", role: "ADC", kda: "7.4/2.0/6.8", winRate: 66, tendency: "balanced", championPool: ["Xayah", "Kai'Sa", "Varus"] },
      { name: "Quad", role: "Mid", kda: "6.2/2.5/7.3", winRate: 72, tendency: "aggressive", championPool: ["LeBlanc", "Akali", "Sylas"] },
      { name: "Bwipo", role: "Top", kda: "4.8/2.9/6.1", winRate: 68, tendency: "aggressive", championPool: ["Aatrox", "Fiora", "Gangplank"] },
      { name: "Inspired", role: "Jungle", kda: "4.5/2.1/9.8", winRate: 74, tendency: "balanced", championPool: ["Maokai", "Wukong", "Rek'Sai"] },
    ],
    recentMatches: [
      { result: "W", opponent: "Team Liquid", score: "2-1", duration: "41:08" },
      { result: "W", opponent: "Cloud9", score: "2-0", duration: "28:55" },
      { result: "W", opponent: "100T", score: "2-1", duration: "35:22" },
      { result: "L", opponent: "EG", score: "1-2", duration: "38:44" },
      { result: "W", opponent: "TSM", score: "2-0", duration: "26:11" },
    ],
    strengths: [
      { area: "Early Game", rating: 76, trend: "stable" },
      { area: "Team Fighting", rating: 85, trend: "up" },
      { area: "Vision Control", rating: 79, trend: "stable" },
      { area: "Objective Control", rating: 88, trend: "up" },
    ],
    counterStrategies: [
      { id: "cs1", title: "Neutralize Top Lane", description: "Bwipo is their primary engage. Pick tanks to match his aggression and prevent snowball.", effectiveness: "high", phase: "early" },
      { id: "cs2", title: "Control Assassin Picks", description: "Quad's assassin pool is dangerous. Draft point-and-click CC or ban LeBlanc.", effectiveness: "high", phase: "early" },
      { id: "cs3", title: "Avoid Extended Fights", description: "FlyQuest excels at prolonged team fights. Look for picks and quick burst trades.", effectiveness: "medium", phase: "mid" },
    ],
    draftRisks: [
      { champion: "LeBlanc", role: "Mid", threat: "ban", priority: 90, notes: "Quad's signature assassin" },
      { champion: "Aatrox", role: "Top", threat: "pick", priority: 82, notes: "Bwipo team fight presence" },
      { champion: "Maokai", role: "Jungle", threat: "pick", priority: 75, notes: "Inspired's engage tool" },
    ],
    lastUpdated: new Date().toISOString(),
  },
};

export const getScoutingReport = (teamName: string): ScoutingReport | null => {
  return mockScoutingReports[teamName] || null;
};

export const getAvailableTeams = (): string[] => {
  return Object.keys(mockScoutingReports);
};

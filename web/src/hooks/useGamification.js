import { useState, useEffect, useCallback, useMemo } from 'react';
import { gamificationService } from '../services/gamificationService';

// Mock data for development/fallback
const MOCK_ACHIEVEMENTS = [
  {
    code: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first project',
    icon: '🎯',
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-05T10:30:00Z',
    progress: 1,
    target: 1
  },
  {
    code: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 projects in under 15 minutes each',
    icon: '⚡',
    xpReward: 100,
    unlocked: true,
    unlockedAt: '2024-01-06T14:20:00Z',
    progress: 5,
    target: 5
  },
  {
    code: 'perfectionist',
    name: 'Perfectionist',
    description: 'Maintain 100% completion rate for 50 jobs',
    icon: '💎',
    xpReward: 200,
    unlocked: false,
    progress: 32,
    target: 50
  },
  {
    code: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 projects total',
    icon: '🏆',
    xpReward: 500,
    unlocked: false,
    progress: 67,
    target: 100
  },
  {
    code: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 projects between 10PM and 6AM',
    icon: '🦉',
    xpReward: 75,
    unlocked: false,
    progress: 3,
    target: 10
  },
  {
    code: 'marathon',
    name: 'Marathon Runner',
    description: 'Complete 10 projects in a single day',
    icon: '🏃',
    xpReward: 150,
    unlocked: true,
    unlockedAt: '2024-01-07T22:45:00Z',
    progress: 10,
    target: 10
  },
  {
    code: 'reliable',
    name: 'Mr. Reliable',
    description: 'Zero releases for 30 consecutive days',
    icon: '🛡️',
    xpReward: 300,
    unlocked: false,
    progress: 12,
    target: 30
  },
  {
    code: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 20 projects before 8AM',
    icon: '🌅',
    xpReward: 100,
    unlocked: false,
    progress: 8,
    target: 20
  }
];

const MOCK_LEVEL_INFO = {
  level: 5,
  title: 'Master',
  currentXP: 850,
  nextLevelXP: 1000,
  totalXP: 1850,
  perks: ['See job phase before claim', '+5% bonus on all jobs']
};

const generateMockLeaderboard = () => {
  const names = ['Alex Chen', 'Maria Garcia', 'Current User', 'Jordan Smith', 'Taylor Johnson',
                 'Sam Wilson', 'Casey Brown', 'Morgan Lee', 'Riley Davis', 'Avery Martinez'];

  return names.map((name, index) => ({
    rank: index + 1,
    name: name,
    jobsCompleted: Math.max(120 - (index * 8), 45),
    earnings: Math.max(3500 - (index * 250), 1200),
    isCurrentUser: name === 'Current User'
  }));
};

/**
 * Hook for managing gamification data
 */
export const useGamification = () => {
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [xpHistory, setXPHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('week');
  const [usingMockData, setUsingMockData] = useState(false);

  /**
   * Fetch achievements
   */
  const fetchAchievements = useCallback(async () => {
    try {
      const data = await gamificationService.getAchievements();
      setAchievements(data);
      setUsingMockData(false);
    } catch (err) {
      console.warn('Failed to fetch achievements, using mock data:', err);
      setAchievements(MOCK_ACHIEVEMENTS);
      setUsingMockData(true);
    }
  }, []);

  /**
   * Fetch leaderboard
   */
  const fetchLeaderboard = useCallback(async (period = leaderboardPeriod) => {
    try {
      const data = await gamificationService.getLeaderboard(period);
      setLeaderboard(data);
      setUsingMockData(false);
    } catch (err) {
      console.warn('Failed to fetch leaderboard, using mock data:', err);
      setLeaderboard(generateMockLeaderboard());
      setUsingMockData(true);
    }
  }, [leaderboardPeriod]);

  /**
   * Fetch level info
   */
  const fetchLevelInfo = useCallback(async () => {
    try {
      const data = await gamificationService.getLevelInfo();
      setLevelInfo(data);
      setUsingMockData(false);
    } catch (err) {
      console.warn('Failed to fetch level info, using mock data:', err);
      setLevelInfo(MOCK_LEVEL_INFO);
      setUsingMockData(true);
    }
  }, []);

  /**
   * Fetch XP history
   */
  const fetchXPHistory = useCallback(async () => {
    try {
      const data = await gamificationService.getXPHistory();
      setXPHistory(data);
    } catch (err) {
      console.warn('Failed to fetch XP history:', err);
      setXPHistory([]);
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAchievements(),
        fetchLeaderboard(),
        fetchLevelInfo(),
        fetchXPHistory()
      ]);
    } catch (err) {
      console.error('Failed to refresh gamification data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchAchievements, fetchLeaderboard, fetchLevelInfo, fetchXPHistory]);

  /**
   * Change leaderboard period
   */
  const changeLeaderboardPeriod = useCallback((period) => {
    setLeaderboardPeriod(period);
    fetchLeaderboard(period);
  }, [fetchLeaderboard]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Computed values
  const unlockedCount = useMemo(() => {
    return achievements.filter(a => a.unlocked).length;
  }, [achievements]);

  const totalCount = achievements.length;

  const currentRank = useMemo(() => {
    const userEntry = leaderboard.find(entry => entry.isCurrentUser);
    return userEntry ? userEntry.rank : null;
  }, [leaderboard]);

  return {
    // Data
    achievements,
    leaderboard,
    levelInfo,
    xpHistory,

    // State
    loading,
    error,
    usingMockData,

    // Leaderboard period
    leaderboardPeriod,
    changeLeaderboardPeriod,

    // Computed values
    unlockedCount,
    totalCount,
    currentRank,

    // Actions
    refresh
  };
};

export default useGamification;

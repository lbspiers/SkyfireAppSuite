import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { useGamification } from '../../hooks/useGamification';
import AchievementCard from './components/achievements/AchievementCard';
import LevelProgressBar from './components/achievements/LevelProgressBar';
import Leaderboard from './components/Leaderboard';
import styles from './AchievementsPage.module.css';

const AchievementsPage = () => {
  const navigate = useNavigate();
  const [achievementFilter, setAchievementFilter] = useState('all');

  const {
    achievements,
    leaderboard,
    levelInfo,
    loading,
    error,
    leaderboardPeriod,
    changeLeaderboardPeriod,
    unlockedCount,
    totalCount,
    usingMockData
  } = useGamification();

  const filteredAchievements = useMemo(() => {
    switch (achievementFilter) {
      case 'unlocked':
        return achievements.filter(a => a.unlocked);
      case 'locked':
        return achievements.filter(a => !a.unlocked);
      default:
        return achievements;
    }
  }, [achievements, achievementFilter]);

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'unlocked', label: 'Unlocked' },
    { value: 'locked', label: 'Locked' }
  ];

  if (error && !usingMockData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>Failed to load achievements</div>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🏆</span>
            Achievements
          </h1>
          <p className={styles.subtitle}>
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      {usingMockData && (
        <div className={styles.mockDataBanner}>
          📊 Showing mock data (API not connected)
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className={styles.layout}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Level Progress */}
          <div className={styles.section}>
            <LevelProgressBar levelInfo={levelInfo} />
          </div>

          {/* Achievement Filters */}
          <div className={styles.filterSection}>
            <div className={styles.filterTabs}>
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  className={`${styles.filterTab} ${
                    achievementFilter === filter.value ? styles.filterTabActive : ''
                  }`}
                  onClick={() => setAchievementFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          {filteredAchievements.length > 0 ? (
            <div className={styles.achievementsGrid}>
              {filteredAchievements.map((achievement) => (
                <AchievementCard key={achievement.code} achievement={achievement} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎯</div>
              <div className={styles.emptyText}>
                No {achievementFilter} achievements
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sticky Leaderboard */}
        <div className={styles.rightColumn}>
          <div className={styles.stickyLeaderboard}>
            <Leaderboard
              data={leaderboard}
              period={leaderboardPeriod}
              onPeriodChange={changeLeaderboardPeriod}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;

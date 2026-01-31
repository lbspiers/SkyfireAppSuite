import React from 'react';
import { motion } from 'framer-motion';
import StatCard from './StatCard';
import styles from '../../styles/Dashboard.module.css';

/**
 * DashboardStats - Grid container for KPI stat cards with stagger animation
 *
 * @param {object} stats - Statistics object with totalProjects, totalCustomers, avgLeadTime, activeTickets
 * @param {boolean} loading - Loading state
 */
const DashboardStats = ({ stats, loading = false }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: '🔨',
      change: 12,
      changeLabel: 'vs last month',
      trend: 'up'
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: '👥',
      change: 8,
      changeLabel: 'vs last month',
      trend: 'up'
    },
    {
      title: 'Avg Lead Time',
      value: stats?.avgLeadTime || 0,
      icon: '⏱️',
      change: 3,
      changeLabel: 'days improvement',
      trend: 'down'
    },
    {
      title: 'Active Tickets',
      value: stats?.activeTickets || 0,
      icon: '🎫',
      change: undefined,
      changeLabel: '',
      trend: 'neutral'
    }
  ];

  return (
    <motion.div
      className={styles.statsGrid}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          change={card.change}
          changeLabel={card.changeLabel}
          trend={card.trend}
          loading={loading}
        />
      ))}
    </motion.div>
  );
};

export default DashboardStats;

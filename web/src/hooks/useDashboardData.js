import { useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';
import moment from 'moment';
import logger from '../services/devLogger';
import { isCurrentUserAdminAsync } from '../utils/adminUtils';

/**
 * Custom hook to fetch and calculate dashboard statistics
 * Fetches projects from API and calculates KPIs
 */
export const useDashboardData = () => {
  const [data, setData] = useState({
    stats: {
      totalProjects: 0,
      totalCustomers: 0,
      avgLeadTime: 0,
      activeTickets: 0,
    },
    projects: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Get user data from session storage
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

      // Verify admin status with backend
      const isSuperUser = await isCurrentUserAdminAsync();
      const companyId = userData?.company?.uuid;

      // CRITICAL: If user is NOT a super user but has NO company UUID, this is a problem
      if (!isSuperUser && !companyId) {
        logger.error('Dashboard', 'Non-admin user has no company UUID!', {
          userData,
          email: userData?.email
        });
        throw new Error('User account is missing company information. Please contact support.');
      }

      // For super users: fetch ALL projects (no companyId)
      // For regular users: fetch only their company's projects
      const endpoint = isSuperUser
        ? '/project'
        : `/project?companyId=${companyId}`;

      logger.log('Dashboard', 'Fetching projects:', {
        isSuperUser,
        companyId: isSuperUser ? 'ALL' : companyId,
        endpoint,
        userEmail: userData?.email,
        fullUserData: userData
      });

      // Fetch projects from API (just get first page for counts)
      const response = await axios.get(endpoint);

      logger.log('Dashboard', 'Raw response:', response.data);

      const projects = response.data?.data || response.data || [];
      const pagination = response.data?.pagination;

      // Use total from pagination if available, otherwise use array length
      const totalProjectCount = pagination?.total || projects.length;

      logger.log('Dashboard', `Loaded ${projects.length} projects (Total in DB: ${totalProjectCount})`);
      console.log('[useDashboardData] Pagination info:', {
        currentPage: pagination?.page,
        totalPages: pagination?.totalPages,
        total: pagination?.total,
        showing: projects.length
      });

      // Calculate statistics
      const stats = calculateStats(projects);
      const { statusCounts, statusChanges } = calculateStatusCounts(projects, totalProjectCount);

      setData({
        stats,
        statusCounts,
        statusChanges,
        projects,
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Dashboard', 'Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to load dashboard data',
      }));
    }
  };

  const calculateStats = (projects) => {
    // Total projects count (excluding canceled)
    const activeProjects = projects.filter(p => p.completed_step !== 9);
    const totalProjects = activeProjects.length;

    // Calculate unique customers
    const uniqueCustomers = new Set();
    projects.forEach(project => {
      const firstName = project.details?.customer_first_name;
      const lastName = project.details?.customer_last_name;
      if (firstName && lastName) {
        uniqueCustomers.add(`${firstName} ${lastName}`);
      }
    });
    const totalCustomers = uniqueCustomers.size;

    // Calculate average lead time (days from creation to current status)
    let totalLeadTimeDays = 0;
    let countedProjects = 0;

    activeProjects.forEach(project => {
      const createdAt = project._created_at || project.created_at;
      if (createdAt) {
        const createdDate = moment(createdAt);
        const now = moment();
        const daysDiff = now.diff(createdDate, 'days');

        if (daysDiff >= 0) {
          totalLeadTimeDays += daysDiff;
          countedProjects++;
        }
      }
    });

    const avgLeadTime = countedProjects > 0
      ? Math.round(totalLeadTimeDays / countedProjects)
      : 0;

    // Mock active tickets for now (will be replaced with real API call)
    const activeTickets = Math.floor(totalProjects * 0.15); // Estimate 15% of projects have active tickets

    return {
      totalProjects,
      totalCustomers,
      avgLeadTime,
      activeTickets,
    };
  };

  const calculateStatusCounts = (projects, totalCount) => {
    // Count projects by status (completed_step)
    const counts = {
      all: totalCount || projects.length, // Use total from pagination
      sales: 0,
      site_survey: 0,
      design: 0, // Combined Design and Revisions
      permits: 0,
      install: 0,
      commissioning: 0,
      inspection: 0,
      pto: 0,
    };

    projects.forEach(project => {
      const step = project.completed_step;
      switch(step) {
        case 0: counts.sales++; break;
        case 1: counts.site_survey++; break;
        case 2:
        case 3: counts.design++; break; // Both Design (2) and Revisions (3) count as Design
        case 4: counts.permits++; break;
        case 5: counts.install++; break;
        case 6: counts.commissioning++; break;
        case 7: counts.inspection++; break;
        case 8: counts.pto++; break;
        default: break;
      }
    });

    // Mock changes for now (will calculate from historical data later)
    // Simulate +/- changes based on count (just for demo)
    const changes = {
      all: Math.floor(counts.all * 0.1),
      sales: Math.floor(counts.sales * 0.15),
      site_survey: Math.floor(counts.site_survey * 0.08),
      design: -Math.floor(counts.design * 0.05), // negative example
      permits: Math.floor(counts.permits * 0.06),
      install: Math.floor(counts.install * 0.09),
      commissioning: Math.floor(counts.commissioning * 0.11),
      inspection: Math.floor(counts.inspection * 0.07),
      pto: Math.floor(counts.pto * 0.04),
    };

    return { statusCounts: counts, statusChanges: changes };
  };

  const refetch = useCallback(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Add a new project to the beginning of the projects list
   * Updates stats and status counts accordingly
   * @param {object} newProject - The new project object to add
   */
  const addProject = useCallback((newProject) => {
    setData(prev => {
      // Add project to beginning of array
      const updatedProjects = [newProject, ...prev.projects];

      // Recalculate stats with new project
      const updatedStats = {
        ...prev.stats,
        totalProjects: prev.stats.totalProjects + 1,
      };

      // Update status counts - new projects start at sales (completed_step = 0)
      const updatedStatusCounts = {
        ...prev.statusCounts,
        all: prev.statusCounts.all + 1,
        sales: prev.statusCounts.sales + 1,
      };

      // Update status changes
      const updatedStatusChanges = {
        ...prev.statusChanges,
        all: prev.statusChanges.all + 1,
        sales: prev.statusChanges.sales + 1,
      };

      return {
        ...prev,
        projects: updatedProjects,
        stats: updatedStats,
        statusCounts: updatedStatusCounts,
        statusChanges: updatedStatusChanges,
      };
    });
  }, []);

  return {
    ...data,
    refetch,
    addProject,
  };
};

export default useDashboardData;

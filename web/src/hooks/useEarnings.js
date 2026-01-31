import { useState, useEffect, useCallback } from 'react';
import { earningsService } from '../services/earningsService';

/**
 * Hook for managing earnings data and state
 */
export const useEarnings = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [weeklyChart, setWeeklyChart] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    type: null
  });

  /**
   * Fetch earnings summary
   */
  const fetchSummary = useCallback(async () => {
    try {
      const data = await earningsService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch earnings summary:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch transactions with pagination and filters
   */
  const fetchTransactions = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const data = await earningsService.getTransactions(page, itemsPerPage, filters);
      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  /**
   * Fetch weekly chart data
   */
  const fetchWeeklyChart = useCallback(async () => {
    try {
      const data = await earningsService.getWeeklyChart();
      setWeeklyChart(data);
    } catch (err) {
      console.error('Failed to fetch weekly chart:', err);
    }
  }, []);

  /**
   * Fetch payout history
   */
  const fetchPayoutHistory = useCallback(async () => {
    try {
      const data = await earningsService.getPayoutHistory();
      setPayoutHistory(data);
    } catch (err) {
      console.error('Failed to fetch payout history:', err);
    }
  }, []);

  /**
   * Request a payout
   */
  const requestPayout = useCallback(async (amount, method = 'bank_transfer') => {
    try {
      const result = await earningsService.requestPayout(amount, method);
      // Refresh summary and payout history
      await fetchSummary();
      await fetchPayoutHistory();
      return result;
    } catch (err) {
      console.error('Failed to request payout:', err);
      throw err;
    }
  }, [fetchSummary, fetchPayoutHistory]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      fetchTransactions(page);
    }
  }, [totalPages, fetchTransactions]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchTransactions(),
        fetchWeeklyChart(),
        fetchPayoutHistory()
      ]);
    } catch (err) {
      console.error('Failed to refresh earnings data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, fetchTransactions, fetchWeeklyChart, fetchPayoutHistory]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Reload transactions when filters change
  useEffect(() => {
    if (!loading) {
      fetchTransactions(1);
    }
  }, [filters]);

  return {
    // Data
    summary,
    transactions,
    weeklyChart,
    payoutHistory,

    // State
    loading,
    error,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,

    // Filters
    filters,
    updateFilters,

    // Actions
    requestPayout,
    refresh
  };
};

export default useEarnings;

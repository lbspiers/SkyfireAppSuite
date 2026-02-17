import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import { Button } from '../ui';
import styles from './AnalyticsDashboard.module.css';

const DA_API_URL = process.env.REACT_APP_DA_API_URL || 'https://api.skyfireapp.io';

// Color palette for charts
const COLORS = {
  primary: '#F97316',
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  red: '#EF4444',
  cyan: '#06B6D4',
  pink: '#EC4899',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.blue,
  COLORS.green,
  COLORS.purple,
  COLORS.amber,
  COLORS.cyan,
  COLORS.pink,
  COLORS.red,
];

const AnalyticsDashboard = ({ token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${DA_API_URL}/api/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3 className={styles.errorTitle}>⚠️ Error Loading Analytics</h3>
        <p className={styles.errorMessage}>{error}</p>
        <Button variant="secondary" onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const kpis = data.kpis || {};
  const successRate = kpis.runs_completed + kpis.runs_failed > 0
    ? ((kpis.runs_completed / (kpis.runs_completed + kpis.runs_failed)) * 100).toFixed(1)
    : 0;

  // Calculate stats for geographic tab
  const statesServed = data.by_state?.length || 0;
  const topState = data.by_state?.[0] || {};
  const topCity = data.top_cities?.[0] || {};
  const mappedLocations = data.map_pins?.length || 0;

  return (
    <div className={styles.container}>
      {/* Header with Refresh Button */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Analytics Dashboard</h2>
          <p className={styles.subtitle}>Comprehensive metrics and insights</p>
        </div>
        <Button variant="secondary" onClick={fetchData}>
          Refresh Data
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className={styles.subTabs}>
        {['overview', 'performance', 'volume', 'clients', 'geographic', 'recent_runs'].map(tab => (
          <button
            key={tab}
            className={`${styles.subTab} ${activeSubTab === tab ? styles.subTabActive : ''}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {activeSubTab === 'overview' && (
          <OverviewTab
            kpis={kpis}
            successRate={successRate}
            weeklyVolume={data.weekly_volume}
            performanceTrend={data.performance_trend}
            byClient={data.by_client}
            byState={data.by_state}
          />
        )}

        {activeSubTab === 'performance' && (
          <PerformanceTab
            kpis={kpis}
            successRate={successRate}
            performanceTrend={data.performance_trend}
          />
        )}

        {activeSubTab === 'volume' && (
          <VolumeTab
            kpis={kpis}
            weeklyVolume={data.weekly_volume}
            monthlyVolume={data.monthly_volume}
            byStatus={data.by_status}
          />
        )}

        {activeSubTab === 'clients' && (
          <ClientsTab
            byClient={data.by_client}
            perfByClient={data.perf_by_client}
          />
        )}

        {activeSubTab === 'geographic' && (
          <GeographicTab
            statesServed={statesServed}
            topState={topState}
            topCity={topCity}
            mappedLocations={mappedLocations}
            byState={data.by_state}
            topCities={data.top_cities}
            mapPins={data.map_pins}
          />
        )}

        {activeSubTab === 'recent_runs' && (
          <RecentRunsTab recentRuns={data.recent_runs} />
        )}
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, subtitle, color = COLORS.primary, formatValue }) => (
  <div className={styles.kpiCard} style={{ borderLeftColor: color }}>
    <div className={styles.kpiHeader}>
      <span className={styles.kpiTitle}>{title}</span>
    </div>
    <div className={styles.kpiValue} style={{ color }}>
      {formatValue ? formatValue(value) : value?.toLocaleString() || '0'}
    </div>
    {subtitle && <div className={styles.kpiSubtitle}>{subtitle}</div>}
  </div>
);

// Overview Tab
const OverviewTab = ({ kpis, successRate, weeklyVolume, performanceTrend, byClient, byState }) => (
  <div className={styles.tabContent}>
    {/* KPI Cards Row 1 */}
    <div className={styles.kpiGrid}>
      <KPICard title="Total Projects" value={kpis.total_projects} color={COLORS.primary} />
      <KPICard title="This Month" value={kpis.projects_this_month} color={COLORS.blue} />
      <KPICard title="This Week" value={kpis.projects_this_week} color={COLORS.green} />
      <KPICard title="Today" value={kpis.projects_today} color={COLORS.purple} />
    </div>

    {/* KPI Cards Row 2 */}
    <div className={styles.kpiGrid}>
      <KPICard
        title="Avg Pipeline Time"
        value={kpis.avg_pipeline_ms}
        color={COLORS.primary}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Avg Recalc Time"
        value={kpis.avg_recalc_ms}
        color={COLORS.blue}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Avg AutoCAD Time"
        value={kpis.avg_da_ms}
        color={COLORS.green}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Success Rate"
        value={successRate}
        color={COLORS.purple}
        formatValue={(v) => `${v}%`}
      />
    </div>

    {/* Charts Grid */}
    <div className={styles.chartsGrid}>
      {/* Weekly Volume */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Weekly Project Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyVolume || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis dataKey="week" stroke="#8B9AB8" />
            <YAxis stroke="#8B9AB8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Bar dataKey="count" fill={COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Trend */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Pipeline Duration Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis dataKey="date" stroke="#8B9AB8" />
            <YAxis stroke="#8B9AB8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Legend />
            <Line type="monotone" dataKey="avg_total_ms" stroke={COLORS.primary} name="Total" />
            <Line type="monotone" dataKey="avg_recalc_ms" stroke={COLORS.blue} name="Recalc" />
            <Line type="monotone" dataKey="avg_da_ms" stroke={COLORS.green} name="AutoCAD" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Client Distribution */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Projects by Client</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byClient || []}
              dataKey="total_projects"
              nameKey="client"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {(byClient || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* State Distribution */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Projects by State</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={(byState || []).slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis type="number" stroke="#8B9AB8" />
            <YAxis dataKey="state" type="category" stroke="#8B9AB8" width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
            />
            <Bar dataKey="count" fill={COLORS.blue} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// Performance Tab
const PerformanceTab = ({ kpis, successRate, performanceTrend }) => (
  <div className={styles.tabContent}>
    {/* KPI Cards Row 1 */}
    <div className={styles.kpiGrid}>
      <KPICard
        title="Avg Total Time"
        value={kpis.avg_pipeline_ms}
        color={COLORS.primary}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Avg Recalc Time"
        value={kpis.avg_recalc_ms}
        color={COLORS.blue}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Avg AutoCAD Time"
        value={kpis.avg_da_ms}
        color={COLORS.green}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Success Rate"
        value={successRate}
        color={COLORS.purple}
        formatValue={(v) => `${v}%`}
      />
    </div>

    {/* KPI Cards Row 2 */}
    <div className={styles.kpiGrid}>
      <KPICard
        title="Fastest Run"
        value={kpis.fastest_run_ms}
        color={COLORS.green}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
      <KPICard
        title="Slowest Run"
        value={kpis.slowest_run_ms}
        color={COLORS.red}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
      />
    </div>

    {/* Charts */}
    <div className={styles.chartsGrid}>
      {/* Stacked Area Chart */}
      <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
        <h3 className={styles.chartTitle}>Duration Breakdown Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis dataKey="date" stroke="#8B9AB8" />
            <YAxis stroke="#8B9AB8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="avg_recalc_ms"
              stackId="1"
              stroke={COLORS.blue}
              fill={COLORS.blue}
              name="Recalc"
            />
            <Area
              type="monotone"
              dataKey="avg_da_ms"
              stackId="1"
              stroke={COLORS.green}
              fill={COLORS.green}
              name="AutoCAD"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Runs Per Day */}
      <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
        <h3 className={styles.chartTitle}>Runs Per Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis dataKey="date" stroke="#8B9AB8" />
            <YAxis stroke="#8B9AB8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Legend />
            <Bar dataKey="completed" stackId="a" fill={COLORS.green} name="Completed" />
            <Bar dataKey="failed" stackId="a" fill={COLORS.red} name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// Volume Tab
const VolumeTab = ({ kpis, weeklyVolume, monthlyVolume, byStatus }) => {
  const avgPerWeek = weeklyVolume?.length > 0
    ? (weeklyVolume.reduce((sum, w) => sum + w.count, 0) / weeklyVolume.length).toFixed(1)
    : 0;
  const avgPerMonth = monthlyVolume?.length > 0
    ? (monthlyVolume.reduce((sum, m) => sum + m.count, 0) / monthlyVolume.length).toFixed(1)
    : 0;

  return (
    <div className={styles.tabContent}>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KPICard title="Total Projects" value={kpis.total_projects} color={COLORS.primary} />
        <KPICard title="Today" value={kpis.projects_today} color={COLORS.blue} />
        <KPICard title="Avg/Week" value={avgPerWeek} color={COLORS.green} />
        <KPICard title="Avg/Month" value={avgPerMonth} color={COLORS.purple} />
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Monthly Volume */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle}>Monthly Volume (12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyVolume || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="month" stroke="#8B9AB8" />
              <YAxis stroke="#8B9AB8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyVolume || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="week" stroke="#8B9AB8" />
              <YAxis stroke="#8B9AB8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              />
              <Area type="monotone" dataKey="count" stroke={COLORS.blue} fill={COLORS.blue} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byStatus || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis type="number" stroke="#8B9AB8" />
              <YAxis dataKey="status" type="category" stroke="#8B9AB8" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
              />
              <Bar dataKey="count" fill={COLORS.green} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Clients Tab
const ClientsTab = ({ byClient, perfByClient }) => (
  <div className={styles.tabContent}>
    {/* Charts */}
    <div className={styles.chartsGrid}>
      {/* Projects by Client */}
      <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
        <h3 className={styles.chartTitle}>Projects by Client (Total vs Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byClient || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis type="number" stroke="#8B9AB8" />
            <YAxis dataKey="client" type="category" stroke="#8B9AB8" width={150} />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
            />
            <Legend />
            <Bar dataKey="total_projects" fill={COLORS.primary} name="Total" />
            <Bar dataKey="last_30_days" fill={COLORS.blue} name="Last 30 Days" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Client Distribution Pie */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Client Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byClient || []}
              dataKey="total_projects"
              nameKey="client"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {(byClient || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Table */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Performance by Client</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Runs</th>
                <th>Avg Time</th>
                <th>Completed</th>
                <th>Failed</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {(perfByClient || []).map((client, idx) => {
                const successRate = client.runs > 0
                  ? ((client.completed / client.runs) * 100).toFixed(1)
                  : 0;
                return (
                  <tr key={idx}>
                    <td>{client.client}</td>
                    <td>{client.runs}</td>
                    <td>{(client.avg_ms / 1000).toFixed(1)}s</td>
                    <td>{client.completed}</td>
                    <td>{client.failed}</td>
                    <td>{successRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Geographic Tab
const GeographicTab = ({ statesServed, topState, topCity, mappedLocations, byState, topCities, mapPins }) => (
  <div className={styles.tabContent}>
    {/* KPI Cards */}
    <div className={styles.kpiGrid}>
      <KPICard title="States Served" value={statesServed} color={COLORS.primary} />
      <KPICard
        title="Top State"
        value={`${topState.state || 'N/A'} (${topState.count || 0})`}
        color={COLORS.blue}
        formatValue={(v) => v}
      />
      <KPICard
        title="Top City"
        value={`${topCity.city || 'N/A'}, ${topCity.state || ''} (${topCity.count || 0})`}
        color={COLORS.green}
        formatValue={(v) => v}
      />
      <KPICard title="Mapped Locations" value={mappedLocations} color={COLORS.purple} />
    </div>

    {/* Charts */}
    <div className={styles.chartsGrid}>
      {/* State Distribution */}
      <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
        <h3 className={styles.chartTitle}>Projects by State</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byState || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
            <XAxis type="number" stroke="#8B9AB8" />
            <YAxis dataKey="state" type="category" stroke="#8B9AB8" width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: '#131C2E', border: '1px solid #1E2D45' }}
            />
            <Bar dataKey="count" fill={COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 20 Cities Table */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Top 20 Cities</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>City</th>
                <th>State</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              {(topCities || []).slice(0, 20).map((city, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{city.city}</td>
                  <td>{city.state}</td>
                  <td>{city.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Cards */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Recent Locations (Sample)</h3>
        <div className={styles.locationGrid}>
          {(mapPins || []).slice(0, 8).map((pin, idx) => (
            <div key={idx} className={styles.locationCard}>
              <div className={styles.locationCustomer}>{pin.customer}</div>
              <div className={styles.locationDetails}>
                {pin.city}, {pin.state}
              </div>
              <div className={styles.locationCoords}>
                {pin.latitude?.toFixed(4)}, {pin.longitude?.toFixed(4)}
              </div>
              <div className={styles.locationClient}>{pin.client}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Recent Runs Tab
const RecentRunsTab = ({ recentRuns }) => (
  <div className={styles.tabContent}>
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Client</th>
            <th>Status</th>
            <th className={styles.highlightColumn}>Total Time</th>
            <th>Recalc Time</th>
            <th>AutoCAD Time</th>
            <th>Blocks</th>
            <th>Fields</th>
            <th>PDF Size</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {(recentRuns || []).map((run) => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{run.customer_name}</td>
              <td>{run.client}</td>
              <td>
                <span
                  className={`${styles.badge} ${
                    run.status === 'completed' ? styles.badgeSuccess : styles.badgeError
                  }`}
                >
                  {run.status}
                </span>
              </td>
              <td className={styles.highlightColumn}>
                {(run.total_duration_ms / 1000).toFixed(1)}s
              </td>
              <td>{(run.step_excel_recalc_ms / 1000).toFixed(1)}s</td>
              <td>{(run.step_da_processing_ms / 1000).toFixed(1)}s</td>
              <td>{run.da_blocks_inserted}</td>
              <td>{run.da_fields_replaced}</td>
              <td>{(run.da_pdf_size_bytes / 1024).toFixed(1)} KB</td>
              <td>{new Date(run.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AnalyticsDashboard;

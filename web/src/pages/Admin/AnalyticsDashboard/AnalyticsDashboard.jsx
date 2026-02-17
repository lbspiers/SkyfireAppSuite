import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const API_BASE = process.env.REACT_APP_DA_API_URL || "https://api.skyfireapp.io";
const TOKEN    = process.env.REACT_APP_DA_TOKEN   || "";

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: "#060C18", surface: "#0B1120", card: "#111A2E", cardAlt: "#162036",
  border: "#1C2B44", borderLt: "#243552",
  text: "#E8EDF5", textMid: "#8B9AB8", textDim: "#4A5B75",
  orange: "#F97316", orangeLt: "#FB923C", orangeBg: "rgba(249,115,22,0.08)",
  blue: "#3B82F6", blueLt: "#60A5FA", blueBg: "rgba(59,130,246,0.08)",
  green: "#10B981", greenLt: "#34D399", greenBg: "rgba(16,185,129,0.08)",
  red: "#EF4444", redLt: "#F87171", redBg: "rgba(239,68,68,0.08)",
  purple: "#8B5CF6", purpleLt: "#A78BFA", purpleBg: "rgba(139,92,246,0.08)",
  amber: "#F59E0B", amberLt: "#FBBF24", amberBg: "rgba(245,158,11,0.08)",
  cyan: "#06B6D4", cyanLt: "#22D3EE", cyanBg: "rgba(6,182,212,0.08)",
};
const PIE_COLORS = [C.orange, C.blue, C.green, C.purple, C.amber, C.cyan, C.redLt, C.orangeLt];

// ═══════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════
const filterTestClients = (item) => {
  const clientName = item.client || item.installer || "";
  return !clientName.toLowerCase().includes("skyfire");
};

// ═══════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════
const fmtMs   = (ms) => ms != null && ms > 0 ? (ms / 1000).toFixed(1) + "s" : "—";
const fmtMins = (ms) => ms != null && ms > 0 ? (ms / 60000).toFixed(1) + "m" : "—";
const fmtHrs  = (h)  => h != null && typeof h === 'number' ? h.toFixed(1) + "h" : "—";
const fmtK    = (n)  => {
  if (n == null) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 10000)   return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
};
const fmtPct  = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) + "%" : "—";
const fmtDate = (v) => {
  try { return new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" }); }
  catch { return v; }
};
const fmtDateTime = (v) => {
  try { return new Date(v).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return v; }
};
const fmtBytes = (b) => {
  if (!b) return "—";
  if (b > 1048576) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1024).toFixed(0) + " KB";
};
const fmtMonth = (m) => {
  try { const [y, mo] = m.split("-"); return new Date(y, mo - 1).toLocaleDateString("en", { month: "short", year: "2-digit" }); }
  catch { return m; }
};

const ttStyle = {
  contentStyle: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "8px 12px" },
  itemStyle: { color: C.textMid, fontSize: 12 },
  labelStyle: { color: C.text, fontWeight: 600, marginBottom: 4 },
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function KPI({ label, value, sub, color = C.orange, icon }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${color}`, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: C.textMid, letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children, rightHeader, span = 1, style: extra = {} }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: "18px", gridColumn: `span ${span}`, ...extra }}>
      {(title || rightHeader) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          {title && <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>}
          {rightHeader}
        </div>
      )}
      {children}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    completed: { bg: C.greenBg, color: C.green, label: "Completed" },
    failed:    { bg: C.redBg,   color: C.red,   label: "Failed" },
    running:   { bg: C.blueBg,  color: C.blue,  label: "Running" },
    pending:   { bg: C.amberBg, color: C.amber, label: "Pending" },
    success:   { bg: C.greenBg, color: C.green, label: "Success" },
    complete:  { bg: C.greenBg, color: C.green, label: "Complete" },
    draft:     { bg: C.purpleBg, color: C.purple, label: "Draft" },
    processing:{ bg: C.blueBg,  color: C.blue,  label: "Processing" },
  };
  const s = map[status?.toLowerCase()] || { bg: C.purpleBg, color: C.purple, label: status || "Unknown" };
  return <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{s.label}</span>;
}

function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: C.textMid, gap: 10, fontSize: 14 }}>
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◈</span>
      Loading analytics…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrBox({ msg, retry }) {
  return (
    <div style={{ background: C.redBg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 10, padding: 24, textAlign: "center", margin: "40px auto", maxWidth: 420 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: C.redLt, marginBottom: 8 }}>⚠ Error Loading Analytics</div>
      <div style={{ color: C.textMid, fontSize: 13, marginBottom: 16 }}>{msg}</div>
      {retry && <button onClick={retry} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>Retry</button>}
    </div>
  );
}

function DataTable({ columns, rows, maxHeight = 400 }) {
  return (
    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight, borderRadius: 6, border: `1px solid ${C.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>{columns.map((col, i) => (
            <th key={i} style={{ padding: "8px 12px", textAlign: col.align || "left", color: C.textMid, fontWeight: 600, borderBottom: `1px solid ${C.border}`, background: C.cardAlt, position: "sticky", top: 0, zIndex: 1, whiteSpace: "nowrap", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>{col.label}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : C.cardAlt }}>
              {columns.map((col, ci) => (
                <td key={ci} style={{ padding: "8px 12px", color: C.text, borderBottom: `1px solid ${C.border}`, textAlign: col.align || "left", whiteSpace: "nowrap" }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length} style={{ padding: 30, textAlign: "center", color: C.textDim }}>No data available</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function BudgetGauge({ used, limit }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct > 90 ? C.red : pct > 70 ? C.amber : C.green;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMid, marginBottom: 5 }}>
        <span>{fmtHrs(used)} used</span><span>{fmtHrs(limit)} limit</span>
      </div>
      <div style={{ background: C.surface, borderRadius: 5, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ fontSize: 10, color, marginTop: 3, textAlign: "right", fontWeight: 600 }}>{pct.toFixed(1)}% consumed</div>
    </div>
  );
}

function TogglePills({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, background: C.surface, borderRadius: 6, padding: 2 }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          background: value === opt.value ? C.orange : "transparent",
          color: value === opt.value ? "#fff" : C.textDim,
          border: "none", borderRadius: 4, padding: "4px 10px",
          fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
        }}>{opt.label}</button>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════
function ExecutiveTab({ data, usage }) {
  const k = data.kpis || {};
  const cm = usage?.current_month || {};
  const totalRuns = (Number(k.runs_completed) || 0) + (Number(k.runs_failed) || 0);
  const sr = totalRuns > 0 ? ((Number(k.runs_completed) || 0) / totalRuns * 100).toFixed(1) : "—";
  const stateData  = [...(data.by_state || [])].sort((a, b) => b.count - a.count);
  const clientData = [...(data.by_client || [])].filter(filterTestClients).sort((a, b) => b.total_projects - a.total_projects).slice(0, 8);
  const [volumeMode, setVolumeMode] = useState("week");

  const volumeData = useMemo(() => {
    switch (volumeMode) {
      case "day":   return { data: (data.daily_volume || []).slice(-14), key: "date", fmt: fmtDate };
      case "week":  return { data: (data.weekly_volume || []).slice(-12), key: "week", fmt: fmtDate };
      case "month": return { data: (data.monthly_volume || []).slice(-12), key: "month", fmt: fmtMonth };
      case "qtr":   return { data: data.quarterly_volume || [], key: "quarter", fmt: (v) => v };
      default:      return { data: (data.weekly_volume || []).slice(-12), key: "week", fmt: fmtDate };
    }
  }, [volumeMode, data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row 1: KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
        <KPI icon="📦" label="Total Projects" value={k.total_projects ?? 0} sub="All time" color={C.orange} />
        <KPI icon="📅" label="This Month" value={k.projects_this_month ?? 0} sub={`${k.projects_this_week ?? 0} this week`} color={C.blue} />
        <KPI icon="⚡" label="Avg Pipeline" value={fmtMs(k.avg_pipeline_ms)} sub={`Recalc ${fmtMs(k.avg_recalc_ms)} · DA ${fmtMs(k.avg_da_ms)}`} color={C.green} />
        <KPI icon="✓" label="Success Rate" value={sr !== "—" ? sr + "%" : "—"} sub={`${k.runs_completed ?? 0} pass · ${k.runs_failed ?? 0} fail`} color={sr !== "—" && parseFloat(sr) >= 95 ? C.green : C.amber} />
        <KPI icon="🌎" label="States" value={stateData.length} sub={stateData[0] ? `Top: ${stateData[0].state}` : ""} color={C.cyan} />
      </div>

      {/* Row 2: DA Cloud Budget — wide banner */}
      <div style={{
        background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: "16px 20px",
        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.purple}30, ${C.purple}10)`,
            border: `1px solid ${C.purple}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>☁️</div>
          <div>
            <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em" }}>DA Cloud Budget</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 1 }}>
              {cm.hours_used != null ? fmtHrs(cm.hours_used) : "—"}
              <span style={{ fontSize: 13, color: C.textDim, fontWeight: 400, marginLeft: 6 }}>of {cm.hours_limit ?? "—"}h</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 20px" }}>
          {cm.hours_limit ? (
            <BudgetGauge used={cm.hours_used || 0} limit={cm.hours_limit} />
          ) : (
            <div style={{ color: C.textDim, fontSize: 11 }}>No budget data — run DA jobs to populate</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Jobs", value: cm.jobs ?? 0, color: C.text },
            { label: "Successful", value: cm.successful ?? 0, color: C.green },
            { label: "Remaining", value: fmtHrs(cm.hours_remaining), color: cm.hours_remaining > 10 ? C.green : C.red },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.03em" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Volume (with Day/Week/Month/Qtr toggle) + Clients bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Project Volume" rightHeader={
          <TogglePills options={[
            { label: "Day", value: "day" }, { label: "Week", value: "week" },
            { label: "Month", value: "month" }, { label: "Qtr", value: "qtr" },
          ]} value={volumeMode} onChange={setVolumeMode} />
        }>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={volumeData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey={volumeData.key} tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={volumeData.fmt}
                interval={volumeMode === "day" ? 1 : 0}
                angle={volumeMode === "day" ? -35 : 0}
                textAnchor={volumeMode === "day" ? "end" : "middle"}
                height={volumeMode === "day" ? 45 : 28} />
              <YAxis tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
              <Tooltip {...ttStyle} labelFormatter={volumeData.fmt} />
              <Bar dataKey="count" name="Projects" fill={C.orange} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Projects by Client">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={clientData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
              <YAxis dataKey="client" type="category" tick={{ fill: C.textMid, fontSize: 10 }} width={120}
                tickFormatter={(v) => v.length > 16 ? v.slice(0, 15) + "…" : v} />
              <Tooltip {...ttStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="total_projects" name="All Time" fill={C.orange} radius={[0, 3, 3, 0]} barSize={12} />
              <Bar dataKey="last_30_days" name="Last 30d" fill={C.blue} radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 4: States + Top Cities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Projects by State">
          <ResponsiveContainer width="100%" height={Math.max(180, stateData.length * 36)}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
              <YAxis dataKey="state" type="category" tick={{ fill: C.textMid, fontSize: 10 }} width={30} />
              <Tooltip {...ttStyle} />
              <Bar dataKey="count" name="Projects" fill={C.blue} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Top Cities">
          <DataTable maxHeight={200} columns={[
            { key: "city", label: "City" }, { key: "state", label: "State" },
            { key: "count", label: "Projects", align: "right" },
          ]} rows={(data.top_cities || []).slice(0, 10)} />
        </Card>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: PERFORMANCE
// ═══════════════════════════════════════════════════════════════
function PerformanceTab({ data }) {
  const k = data.kpis || {};
  const totalRuns = (Number(k.runs_completed) || 0) + (Number(k.runs_failed) || 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <KPI icon="⏱" label="Avg Pipeline" value={fmtMs(k.avg_pipeline_ms)} color={C.orange} />
        <KPI icon="📊" label="Avg Recalc" value={fmtMs(k.avg_recalc_ms)} sub="Excel Graph API" color={C.blue} />
        <KPI icon="🏗" label="Avg AutoCAD" value={fmtMs(k.avg_da_ms)} sub="Design Automation" color={C.green} />
        <KPI icon="🚀" label="Fastest" value={fmtMs(k.fastest_run_ms)} color={C.cyan} />
        <KPI icon="🐢" label="Slowest" value={fmtMs(k.slowest_run_ms)} color={C.amber} />
        <KPI icon="✓" label="Success Rate" value={fmtPct(k.runs_completed, totalRuns)} sub={`${totalRuns} runs`} color={C.green} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card title="Pipeline Timing Trend">
          {(data.performance_trend || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.performance_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={fmtDate} />
                <YAxis tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={(v) => (v / 1000).toFixed(0) + "s"} />
                <Tooltip {...ttStyle} formatter={(v) => fmtMs(v)} /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="avg_total_ms" name="Total" stroke={C.orange} fill={C.orangeBg} strokeWidth={2} />
                <Area type="monotone" dataKey="avg_recalc_ms" name="Recalc" stroke={C.blue} fill={C.blueBg} strokeWidth={2} />
                <Area type="monotone" dataKey="avg_da_ms" name="AutoCAD" stroke={C.green} fill={C.greenBg} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: C.textDim, textAlign: "center", padding: 60, fontSize: 13 }}>Data will appear as DA runs complete</div>
          )}
        </Card>
        <Card title="Performance by Client">
          <DataTable maxHeight={240} columns={[
            { key: "client", label: "Client" }, { key: "runs", label: "Runs", align: "right" },
            { key: "avg_ms", label: "Avg", align: "right", render: (v) => fmtMs(v) },
            { key: "completed", label: "✓", align: "right", render: (v) => <span style={{ color: C.green }}>{v}</span> },
            { key: "failed", label: "✗", align: "right", render: (v) => <span style={{ color: v > 0 ? C.red : C.textDim }}>{v}</span> },
          ]} rows={(data.perf_by_client || []).filter(filterTestClients)} />
        </Card>
      </div>
      <Card title="Recent DA Runs">
        <DataTable maxHeight={280} columns={[
          { key: "project_id", label: "Project" }, { key: "customer_name", label: "Customer" },
          { key: "client", label: "Client" },
          { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
          { key: "total_duration_ms", label: "Total", align: "right", render: (v) => <span style={{ color: C.orange, fontWeight: 600 }}>{fmtMs(v)}</span> },
          { key: "step_excel_recalc_ms", label: "Recalc", align: "right", render: fmtMs },
          { key: "step_da_processing_ms", label: "DA", align: "right", render: fmtMs },
          { key: "da_blocks_inserted", label: "Blocks", align: "right" },
          { key: "da_fields_replaced", label: "Fields", align: "right" },
          { key: "da_pages_plotted", label: "Pages", align: "right" },
          { key: "created_at", label: "Date", render: fmtDateTime },
        ]} rows={data.recent_runs || []} />
      </Card>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: PROJECTS
// ═══════════════════════════════════════════════════════════════
function ProjectsTab({ data }) {
  const k = data.kpis || {};
  const monthly = (data.monthly_volume || []).slice(-12);
  const weekly  = (data.weekly_volume || []).slice(-16);
  const byStatus = data.by_status || [];
  const avgPerWeek  = weekly.length > 0 ? (weekly.reduce((s, w) => s + w.count, 0) / weekly.length).toFixed(1) : "—";
  const avgPerMonth = monthly.length > 0 ? (monthly.reduce((s, m) => s + m.count, 0) / monthly.length).toFixed(1) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
        <KPI icon="📦" label="Total Projects" value={k.total_projects ?? 0} color={C.orange} />
        <KPI icon="📅" label="Today" value={k.projects_today ?? 0} color={C.blue} />
        <KPI icon="📈" label="Avg / Week" value={avgPerWeek} color={C.green} />
        <KPI icon="📊" label="Avg / Month" value={avgPerMonth} color={C.purple} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card title="Monthly Volume">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={fmtMonth} />
              <YAxis tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
              <Tooltip {...ttStyle} labelFormatter={fmtMonth} />
              <Bar dataKey="count" name="Projects" fill={C.orange} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Status Breakdown">
          {byStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                    {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie><Tooltip {...ttStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {byStatus.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], display: "inline-block" }} />{s.status}
                    </span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color: C.textDim, textAlign: "center", padding: 40 }}>No status data</div>}
        </Card>
      </div>
      <Card title="Weekly Trend">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="week" tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={fmtDate} />
            <YAxis tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
            <Tooltip {...ttStyle} labelFormatter={fmtDate} />
            <Area type="monotone" dataKey="count" name="Projects" stroke={C.blue} fill={C.blueBg} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: CLIENTS
// ═══════════════════════════════════════════════════════════════
function ClientsTab({ data }) {
  const clients = [...(data.by_client || [])].filter(filterTestClients).sort((a, b) => b.total_projects - a.total_projects);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="Projects by Client (All Time vs Last 30 Days)">
        <ResponsiveContainer width="100%" height={Math.max(220, clients.length * 36)}>
          <BarChart data={clients} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis type="number" tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
            <YAxis dataKey="client" type="category" tick={{ fill: C.textMid, fontSize: 10 }} width={140} />
            <Tooltip {...ttStyle} /><Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="total_projects" name="All Time" fill={C.orange} radius={[0, 3, 3, 0]} />
            <Bar dataKey="last_30_days" name="Last 30d" fill={C.blue} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Client Pipeline Performance">
        <DataTable maxHeight={300} columns={[
          { key: "client", label: "Client" }, { key: "runs", label: "Runs", align: "right" },
          { key: "avg_ms", label: "Avg Time", align: "right", render: (v) => fmtMs(v) },
          { key: "completed", label: "Pass", align: "right", render: (v) => <span style={{ color: C.green }}>{v}</span> },
          { key: "failed", label: "Fail", align: "right", render: (v) => <span style={{ color: v > 0 ? C.red : C.textDim }}>{v}</span> },
        ]} rows={(data.perf_by_client || []).filter(filterTestClients)} />
      </Card>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: DA USAGE
// ═══════════════════════════════════════════════════════════════
function DAUsageTab({ usage }) {
  const cm = usage?.current_month || {};
  const monthly = usage?.monthly || [];
  const recent = usage?.recent || [];
  const monthlyAgg = useMemo(() => {
    const map = {};
    monthly.forEach((m) => { if (!map[m.month]) map[m.month] = { month: m.month, hours: 0, jobs: 0 }; map[m.month].hours += m.total_da_hours || 0; map[m.month].jobs += m.total_jobs || 0; });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [monthly]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
        <KPI icon="⏱" label="Hours Used" value={fmtHrs(cm.hours_used)} sub={`of ${cm.hours_limit ?? "—"}h`} color={C.orange} />
        <KPI icon="🔋" label="Remaining" value={fmtHrs(cm.hours_remaining)} color={cm.hours_remaining > 10 ? C.green : C.red} />
        <KPI icon="📦" label="Jobs" value={cm.jobs ?? 0} sub={`${cm.successful ?? 0} successful`} color={C.blue} />
        <KPI icon="📅" label="Month" value={cm.month || "—"} color={C.purple} />
      </div>
      <Card title="Cloud Compute Budget"><BudgetGauge used={cm.hours_used || 0} limit={cm.hours_limit || 25} /></Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Monthly DA Hours & Jobs">
          {monthlyAgg.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthlyAgg}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={fmtMonth} />
                <YAxis yAxisId="hrs" tick={{ fill: C.textDim, fontSize: 9 }} />
                <YAxis yAxisId="jobs" orientation="right" tick={{ fill: C.textDim, fontSize: 9 }} />
                <Tooltip {...ttStyle} /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="jobs" dataKey="jobs" name="Jobs" fill={C.blue} radius={[3, 3, 0, 0]} />
                <Line yAxisId="hrs" type="monotone" dataKey="hours" name="Hours" stroke={C.orange} strokeWidth={2} dot={{ fill: C.orange, r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <div style={{ color: C.textDim, textAlign: "center", padding: 60, fontSize: 13 }}>No monthly data yet</div>}
        </Card>
        <Card title="By Pipeline">
          <DataTable maxHeight={220} columns={[
            { key: "month", label: "Month", render: fmtMonth }, { key: "pipeline", label: "Pipeline" },
            { key: "total_jobs", label: "Jobs", align: "right" },
            { key: "successful", label: "✓", align: "right", render: (v) => <span style={{ color: C.green }}>{v}</span> },
            { key: "failed", label: "✗", align: "right", render: (v) => <span style={{ color: v > 0 ? C.red : C.textDim }}>{v}</span> },
            { key: "total_da_hours", label: "Hours", align: "right", render: (v) => v?.toFixed(3) || "—" },
          ]} rows={monthly} />
        </Card>
      </div>
      <Card title="Recent DA Jobs">
        <DataTable maxHeight={300} columns={[
          { key: "workitem_id", label: "Workitem", render: (v) => <span style={{ fontFamily: "monospace", fontSize: 9 }}>{v?.slice(0, 14)}…</span> },
          { key: "pipeline", label: "Pipeline" },
          { key: "project_uuid", label: "Project", render: (v) => v ? <span style={{ fontFamily: "monospace", fontSize: 9 }}>{v.slice(0, 8)}…</span> : "—" },
          { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
          { key: "da_processing_ms", label: "DA Time", align: "right", render: fmtMs },
          { key: "total_duration_ms", label: "Total", align: "right", render: (v) => <span style={{ color: C.orange, fontWeight: 600 }}>{fmtMs(v)}</span> },
          { key: "created_at", label: "Date", render: fmtDateTime },
        ]} rows={recent} />
      </Card>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: GEOGRAPHIC
// ═══════════════════════════════════════════════════════════════
function GeographicTab({ data }) {
  const stateData = [...(data.by_state || [])].sort((a, b) => b.count - a.count);
  const cities = data.top_cities || [];
  const pins = data.map_pins || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
        <KPI icon="🌎" label="States Served" value={stateData.length} color={C.orange} />
        <KPI icon="🏆" label="Top State" value={stateData[0]?.state || "—"} sub={stateData[0] ? `${stateData[0].count} projects` : ""} color={C.blue} />
        <KPI icon="🏙" label="Top City" value={cities[0]?.city || "—"} sub={cities[0] ? `${cities[0].count} projects` : ""} color={C.green} />
        <KPI icon="📍" label="Mapped Pins" value={pins.length} color={C.purple} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Projects by State">
          <ResponsiveContainer width="100%" height={Math.max(180, stateData.length * 36)}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 9 }} allowDecimals={false} />
              <YAxis dataKey="state" type="category" tick={{ fill: C.textMid, fontSize: 10 }} width={30} />
              <Tooltip {...ttStyle} />
              <Bar dataKey="count" name="Projects" fill={C.blue} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Top 20 Cities">
          <DataTable maxHeight={Math.max(180, stateData.length * 36)} columns={[
            { key: "city", label: "City" }, { key: "state", label: "State" },
            { key: "count", label: "Projects", align: "right" },
          ]} rows={cities.slice(0, 20)} />
        </Card>
      </div>
      {pins.length > 0 && (
        <Card title="Project Locations">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, maxHeight: 400, overflowY: "auto" }}>
            {pins.map((p, i) => (
              <div key={i} style={{ background: C.cardAlt, borderRadius: 8, padding: "12px 14px", border: `1px solid ${C.border}`, fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>{p.customer}</div>
                <div style={{ color: C.textMid }}>{p.city}, {p.state}</div>
                <div style={{ color: C.textDim, fontSize: 10, marginTop: 2 }}>{p.client} · {p.latitude?.toFixed(3)}, {p.longitude?.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TAB: RECENT RUNS
// ═══════════════════════════════════════════════════════════════
function RecentRunsTab({ data }) {
  const runs = data.recent_runs || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="All Recent DA Runs — Full Detail">
        <DataTable maxHeight={500} columns={[
          { key: "id", label: "#", align: "right" }, { key: "project_id", label: "Project ID" },
          { key: "customer_name", label: "Customer" }, { key: "client", label: "Client" },
          { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
          { key: "total_duration_ms", label: "Total", align: "right", render: (v) => <span style={{ color: C.orange, fontWeight: 700 }}>{fmtMs(v)}</span> },
          { key: "step_excel_recalc_ms", label: "Recalc", align: "right", render: fmtMs },
          { key: "step_da_processing_ms", label: "DA", align: "right", render: fmtMs },
          { key: "da_blocks_inserted", label: "Blocks", align: "right" },
          { key: "da_fields_replaced", label: "Fields", align: "right" },
          { key: "da_pages_plotted", label: "Pages", align: "right" },
          { key: "da_dwg_size_bytes", label: "DWG", align: "right", render: fmtBytes },
          { key: "da_pdf_size_bytes", label: "PDF", align: "right", render: fmtBytes },
          { key: "created_at", label: "Date", render: fmtDateTime },
          { key: "error_message", label: "Error", render: (v) => v ? <span style={{ color: C.red, fontSize: 10 }}>{v}</span> : <span style={{ color: C.textDim }}>—</span> },
        ]} rows={runs} />
      </Card>
      {runs.slice(0, 3).map((run) => (
        <Card key={run.id} title={`Run #${run.id} — ${run.project_id || run.customer_name || "Unknown"}`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
            {[
              ["Total", run.total_duration_ms, C.orange], ["Excel Recalc", run.step_excel_recalc_ms, C.blue],
              ["DA Process", run.step_da_processing_ms, C.green], ["DB Fetch", run.step_db_fetch_ms, C.purple],
              ["JSON Gen", run.step_json_gen_ms, C.cyan], ["S3 Upload", run.step_s3_upload_ms, C.amber],
              ["Submit", run.step_workitem_submit_ms, C.orangeLt], ["S3 Download", run.step_s3_download_ms, C.blueLt],
              ["PDF Merge", run.step_pdf_merge_ms, C.greenLt], ["DB Update", run.step_db_update_ms, C.purpleLt],
            ].map(([l, v, c], i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 5, padding: "7px 9px", borderLeft: `2px solid ${c}` }}>
                <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 1 }}>{fmtMs(v)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: C.textMid, flexWrap: "wrap" }}>
            <span>Blocks: <strong style={{ color: C.text }}>{run.da_blocks_inserted ?? "—"}</strong></span>
            <span>Fields: <strong style={{ color: C.text }}>{run.da_fields_replaced ?? "—"}</strong></span>
            <span>Pages: <strong style={{ color: C.text }}>{run.da_pages_plotted ?? "—"}</strong></span>
            <span>DWG: <strong style={{ color: C.text }}>{fmtBytes(run.da_dwg_size_bytes)}</strong></span>
            <span>PDF: <strong style={{ color: C.text }}>{fmtBytes(run.da_pdf_size_bytes)}</strong></span>
          </div>
        </Card>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AnalyticsDashboard({ token }) {
  const authToken = token || TOKEN;
  const [data, setData]       = useState(null);
  const [usage, setUsage]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState("executive");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const headers = { Authorization: `Bearer ${authToken}` };
      const [dashRes, usageRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/analytics/dashboard`, { headers }),
        fetch(`${API_BASE}/api/da/usage`, { headers }),
      ]);
      if (dashRes.status === "rejected" || !dashRes.value.ok) {
        throw new Error(dashRes.status === "rejected" ? dashRes.reason?.message || "Network error" : `HTTP ${dashRes.value.status}`);
      }
      setData(await dashRes.value.json());
      if (usageRes.status === "fulfilled" && usageRes.value.ok) setUsage(await usageRes.value.json());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [authToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <Loader />;
  if (error)   return <ErrBox msg={error} retry={fetchAll} />;
  if (!data)   return null;

  const tabs = [
    { id: "executive",   label: "Executive Summary", icon: "◈" },
    { id: "performance", label: "Performance",        icon: "⚡" },
    { id: "projects",    label: "Projects",            icon: "📦" },
    { id: "clients",     label: "Clients",             icon: "🏢" },
    { id: "da_usage",    label: "DA Usage",            icon: "☁️" },
    { id: "geographic",  label: "Geographic",          icon: "🌎" },
    { id: "runs",        label: "Recent Runs",         icon: "📋" },
  ];

  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: "100vh", padding: "24px 28px",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.orange }}>◈</span> SolR Analytics
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textMid }}>Pipeline performance · Project metrics · DA cloud usage · Geographic insights</p>
        </div>
        <button onClick={fetchAll} style={{
          background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
        }}
          onMouseEnter={(e) => { e.target.style.borderColor = C.orange; e.target.style.color = C.orange; }}
          onMouseLeave={(e) => { e.target.style.borderColor = C.border; e.target.style.color = C.text; }}>
          ↻ Refresh
        </button>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "transparent", border: "none", color: tab === t.id ? C.orange : C.textMid,
            padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            borderBottom: tab === t.id ? `2px solid ${C.orange}` : "2px solid transparent",
            transition: "all 0.15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div>
        {tab === "executive"   && <ExecutiveTab data={data} usage={usage} />}
        {tab === "performance" && <PerformanceTab data={data} />}
        {tab === "projects"    && <ProjectsTab data={data} />}
        {tab === "clients"     && <ClientsTab data={data} />}
        {tab === "da_usage"    && <DAUsageTab usage={usage} />}
        {tab === "geographic"  && <GeographicTab data={data} />}
        {tab === "runs"        && <RecentRunsTab data={data} />}
      </div>
    </div>
  );
}

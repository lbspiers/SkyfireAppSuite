/**
 * useTeamSuggestions Hook
 * Analyzes team composition and project needs to suggest invites
 */

import { useState, useEffect, useMemo } from 'react';

// Role requirements by project phase
const PHASE_ROLE_REQUIREMENTS = {
  'Sales': ['Sales'],
  'Site Survey': ['Surveyor'],
  'Design': ['Designer'],
  'Drafting': ['Drafter'],
  'Permitting': ['Admin', 'Designer'],
  'Install': ['Installer'],
  'Inspection': ['Installer'],
};

// Suggestion types with priority (lower = higher priority)
const SUGGESTION_TYPES = {
  MISSING_CRITICAL_ROLE: { priority: 1, dismissDays: 7 },
  PROJECTS_NEED_ROLE: { priority: 2, dismissDays: 3 },
  TEAM_GROWTH: { priority: 3, dismissDays: 14 },
  WORKLOAD_BALANCE: { priority: 4, dismissDays: 7 },
};

/**
 * Hook for generating smart team suggestions
 * @param {Object} options
 * @param {Array} options.members - Current team members
 * @param {Array} options.projects - Company projects (optional)
 * @param {boolean} options.enabled - Enable/disable suggestions
 */
const useTeamSuggestions = ({ members = [], projects = [], enabled = true }) => {
  const [dismissedSuggestions, setDismissedSuggestions] = useState(() => {
    // Load dismissed suggestions from localStorage
    try {
      const stored = localStorage.getItem('teamSuggestionsDismissed');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save dismissed suggestions to localStorage
  useEffect(() => {
    localStorage.setItem('teamSuggestionsDismissed', JSON.stringify(dismissedSuggestions));
  }, [dismissedSuggestions]);

  // Analyze team composition
  const teamAnalysis = useMemo(() => {
    const roleCount = {};
    const activeMembers = members.filter(m => m.status === 2);

    activeMembers.forEach(member => {
      const role = member.role_name || 'Team Member';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return {
      total: activeMembers.length,
      pending: members.filter(m => m.status !== 2).length,
      roleCount,
      hasAdmin: roleCount['Admin'] > 0,
      hasDesigner: roleCount['Designer'] > 0,
      hasSurveyor: roleCount['Surveyor'] > 0,
      hasDrafter: roleCount['Drafter'] > 0,
      hasInstaller: roleCount['Installer'] > 0,
      hasSales: roleCount['Sales'] > 0,
    };
  }, [members]);

  // Analyze project needs
  const projectAnalysis = useMemo(() => {
    if (!projects.length) return null;

    const phaseCount = {};
    const needsRole = {};

    projects.forEach(project => {
      const phase = project.phase || project.status;
      phaseCount[phase] = (phaseCount[phase] || 0) + 1;

      // Check if project phase needs a role we don't have
      const requiredRoles = PHASE_ROLE_REQUIREMENTS[phase] || [];
      requiredRoles.forEach(role => {
        if (!teamAnalysis.roleCount[role]) {
          needsRole[role] = (needsRole[role] || 0) + 1;
        }
      });
    });

    return {
      total: projects.length,
      phaseCount,
      needsRole,
    };
  }, [projects, teamAnalysis]);

  // Generate suggestions
  const suggestions = useMemo(() => {
    if (!enabled) return [];

    const allSuggestions = [];
    const now = Date.now();

    // Helper to check if suggestion is dismissed
    const isDismissed = (id) => {
      const dismissedAt = dismissedSuggestions[id];
      if (!dismissedAt) return false;

      const suggestionType = Object.values(SUGGESTION_TYPES).find(t =>
        id.startsWith(Object.keys(SUGGESTION_TYPES).find(k => SUGGESTION_TYPES[k] === t))
      ) || { dismissDays: 7 };

      const dismissDuration = suggestionType.dismissDays * 24 * 60 * 60 * 1000;
      return (now - dismissedAt) < dismissDuration;
    };

    // 1. Missing critical roles (no one in essential role)
    // REMOVED: Designer and Surveyor suggestions per user request
    // if (teamAnalysis.total > 0) {
    //   if (!teamAnalysis.hasDesigner && !isDismissed('MISSING_CRITICAL_ROLE_Designer')) {
    //     allSuggestions.push({...});
    //   }
    //   if (!teamAnalysis.hasSurveyor && !isDismissed('MISSING_CRITICAL_ROLE_Surveyor')) {
    //     allSuggestions.push({...});
    //   }
    // }

    // 2. Projects need specific roles
    if (projectAnalysis?.needsRole) {
      Object.entries(projectAnalysis.needsRole).forEach(([role, count]) => {
        const suggestionId = `PROJECTS_NEED_ROLE_${role}`;
        if (!isDismissed(suggestionId) && count >= 2) {
          allSuggestions.push({
            id: suggestionId,
            type: 'PROJECTS_NEED_ROLE',
            priority: 2,
            icon: getRoleIcon(role),
            role,
            title: `${count} projects need a ${role}`,
            message: `You have ${count} projects in phases that typically require a ${role.toLowerCase()}.`,
            action: `Invite ${role}`,
          });
        }
      });
    }

    // 3. Team growth suggestions
    if (teamAnalysis.total >= 5 && teamAnalysis.roleCount['Admin'] < 2) {
      const suggestionId = 'TEAM_GROWTH_Admin';
      if (!isDismissed(suggestionId)) {
        allSuggestions.push({
          id: suggestionId,
          type: 'TEAM_GROWTH',
          priority: 3,
          icon: 'ri-shield-star-line',
          role: 'Admin',
          title: 'Consider adding another Admin',
          message: 'With a growing team, having a backup admin helps manage members and settings.',
          action: 'Invite Admin',
        });
      }
    }

    // 4. Workload balance (too few of a busy role)
    if (projectAnalysis?.phaseCount) {
      const designProjects = projectAnalysis.phaseCount['Design'] || 0;
      const designers = teamAnalysis.roleCount['Designer'] || 0;

      if (designProjects > 5 && designers === 1) {
        const suggestionId = 'WORKLOAD_BALANCE_Designer';
        if (!isDismissed(suggestionId)) {
          allSuggestions.push({
            id: suggestionId,
            type: 'WORKLOAD_BALANCE',
            priority: 4,
            icon: 'ri-layout-line',
            role: 'Designer',
            title: 'Your designer might need help',
            message: `You have ${designProjects} projects in design phase with only 1 designer.`,
            action: 'Invite Designer',
          });
        }
      }
    }

    // Sort by priority and return top suggestions
    return allSuggestions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 2); // Max 2 suggestions at a time
  }, [enabled, teamAnalysis, projectAnalysis, dismissedSuggestions]);

  // Dismiss a suggestion
  const dismissSuggestion = (suggestionId) => {
    setDismissedSuggestions(prev => ({
      ...prev,
      [suggestionId]: Date.now(),
    }));
  };

  // Clear all dismissed (for testing)
  const clearDismissed = () => {
    setDismissedSuggestions({});
    localStorage.removeItem('teamSuggestionsDismissed');
  };

  return {
    suggestions,
    teamAnalysis,
    projectAnalysis,
    dismissSuggestion,
    clearDismissed,
    hasSuggestions: suggestions.length > 0,
  };
};

// Helper to get role icon
const getRoleIcon = (role) => {
  const icons = {
    'Admin': 'ri-shield-star-line',
    'Designer': 'ri-layout-line',
    'Surveyor': 'ri-map-pin-line',
    'Drafter': 'ri-draft-line',
    'Installer': 'ri-tools-line',
    'Sales': 'ri-money-dollar-circle-line',
    'Viewer': 'ri-eye-line',
  };
  return icons[role] || 'ri-user-line';
};

export default useTeamSuggestions;

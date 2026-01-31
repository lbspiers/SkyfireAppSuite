/**
 * Survey Mock Data - Equipment-organized data for development
 * Matches mobile app's equipment section structure (30 sections across 6 categories)
 * All notes from single surveyor (Mike Johnson)
 */

// ===== EQUIPMENT CATEGORIES & SECTIONS =====

export const EQUIPMENT_CATEGORIES = {
  SOLAR: {
    label: 'Solar Equipment',
    icon: '☀️',
    sections: [
      { id: 'solar_panel_1', label: 'Solar Panel' },
      { id: 'solar_panel_2', label: 'Solar Panel Type 2' },
      { id: 'optimizer', label: 'Optimizer' },
    ]
  },
  INVERTER: {
    label: 'Inverter Equipment',
    icon: '⚡',
    sections: [
      { id: 'microinverter', label: 'Microinverter' },
      { id: 'string_inverter', label: 'String Inverter' },
    ]
  },
  STORAGE: {
    label: 'Energy Storage',
    icon: '🔋',
    sections: [
      { id: 'energy_storage', label: 'Energy Storage System' },
      { id: 'powerwall', label: 'Tesla PowerWall' },
      { id: 'gateway', label: 'Gateway Configuration' },
    ]
  },
  BATTERY: {
    label: 'Battery Equipment',
    icon: '🔌',
    sections: [
      { id: 'battery_type_1', label: 'Battery Type 1' },
      { id: 'battery_type_2', label: 'Battery Type 2' },
    ]
  },
  ELECTRICAL: {
    label: 'Electrical Panels',
    icon: '⚙️',
    sections: [
      { id: 'string_combiner', label: 'String Combiner Panel' },
      { id: 'system_combiner', label: 'System Combiner Panel' },
      { id: 'battery_combiner', label: 'Battery Combiner Panel' },
      { id: 'sms', label: 'SMS' },
      { id: 'backup_sub_panel', label: 'Backup Load Sub Panel' },
    ]
  },
  BOS: {
    label: 'Balance of System',
    icon: '🔧',
    sections: [
      { id: 'bos_1', label: 'BOS Type 1' },
      { id: 'bos_2', label: 'BOS Type 2' },
      { id: 'bos_3', label: 'BOS Type 3' },
      { id: 'bos_4', label: 'BOS Type 4' },
      { id: 'bos_5', label: 'BOS Type 5' },
      { id: 'bos_6', label: 'BOS Type 6' },
    ]
  },
};

// ===== TAG OPTIONS BY CATEGORY =====

export const TAG_OPTIONS = {
  PANEL: [
    { label: 'Panel Label', value: 'panel_label' },
    { label: 'Installation', value: 'installation' },
    { label: 'Wiring', value: 'wiring' },
    { label: 'Closeup', value: 'closeup' },
    { label: 'Overview', value: 'overview' },
    { label: 'Before', value: 'before' },
    { label: 'After', value: 'after' },
    { label: 'Issue', value: 'issue' },
    { label: 'Complete', value: 'complete' },
  ],
  INVERTER: [
    { label: 'Unit Label', value: 'unit_label' },
    { label: 'Installation', value: 'installation' },
    { label: 'Connections', value: 'connections' },
    { label: 'Display', value: 'display' },
    { label: 'Closeup', value: 'closeup' },
    { label: 'Overview', value: 'overview' },
    { label: 'Complete', value: 'complete' },
  ],
  ELECTRICAL: [
    { label: 'Panel', value: 'panel' },
    { label: 'Connections', value: 'connections' },
    { label: 'Wiring', value: 'wiring' },
    { label: 'Meter', value: 'meter' },
    { label: 'Breakers', value: 'breakers' },
    { label: 'Overview', value: 'overview' },
    { label: 'Complete', value: 'complete' },
  ],
  BOS: [
    { label: 'Monitoring System', value: 'monitoring_system' },
    { label: 'Safety Equipment', value: 'safety_equipment' },
    { label: 'Rapid Shutdown', value: 'rapid_shutdown' },
    { label: 'Performance Check', value: 'performance_check' },
    { label: 'Communication', value: 'communication' },
    { label: 'Overview', value: 'overview' },
    { label: 'Issue', value: 'issue' },
    { label: 'Complete', value: 'complete' },
  ],
};

// Section to tag category mapping
export const SECTION_TAG_MAP = {
  solar_panel_1: 'PANEL',
  solar_panel_2: 'PANEL',
  optimizer: 'PANEL',
  microinverter: 'INVERTER',
  string_inverter: 'INVERTER',
  energy_storage: 'INVERTER',
  powerwall: 'INVERTER',
  gateway: 'INVERTER',
  battery_type_1: 'INVERTER',
  battery_type_2: 'INVERTER',
  string_combiner: 'ELECTRICAL',
  system_combiner: 'ELECTRICAL',
  battery_combiner: 'ELECTRICAL',
  sms: 'INVERTER',
  backup_sub_panel: 'ELECTRICAL',
  bos_1: 'BOS',
  bos_2: 'BOS',
  bos_3: 'BOS',
  bos_4: 'BOS',
  bos_5: 'BOS',
  bos_6: 'BOS',
};

// ===== SINGLE SURVEYOR =====

export const SURVEYOR = {
  id: 'surveyor-001',
  name: 'Mike Johnson',
  initials: 'MJ',
  role: 'Site Surveyor',
};

// ===== MOCK SURVEY NOTES =====

export const mockSurveyNotes = [
  // Solar Panel notes
  {
    id: 'note-001',
    section: 'solar_panel_1',
    content: 'Roof in excellent condition. South-facing slope at approximately 22 degrees. No shading issues observed between 9am-4pm. Recommend 20-panel array configuration with 2 strings of 10.',
    createdAt: '2024-01-15T09:25:00Z',
    updatedAt: '2024-01-15T09:25:00Z',
    createdBy: SURVEYOR,
    isPinned: true,
  },
  {
    id: 'note-002',
    section: 'solar_panel_1',
    content: 'Minor debris accumulation in valley. Homeowner should clear before installation. Flashing in good condition.',
    createdAt: '2024-01-15T09:35:00Z',
    updatedAt: '2024-01-15T09:35:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-003',
    section: 'optimizer',
    content: 'Tigo optimizers recommended for 3 panels on north side to mitigate morning shading from tree. Rest of array can use standard configuration.',
    createdAt: '2024-01-15T09:50:00Z',
    updatedAt: '2024-01-15T09:50:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },

  // Inverter notes
  {
    id: 'note-004',
    section: 'string_inverter',
    content: 'Existing main panel has 40A spare capacity. Will need 60A breaker for new inverter. Recommend panel upgrade to 200A service. Current service entrance cable appears undersized.',
    createdAt: '2024-01-15T10:20:00Z',
    updatedAt: '2024-01-15T10:20:00Z',
    createdBy: SURVEYOR,
    isPinned: true,
  },
  {
    id: 'note-005',
    section: 'string_inverter',
    content: 'Proposed inverter location on garage wall. Good ventilation, shaded from direct sun. 15ft conduit run to main panel.',
    createdAt: '2024-01-15T10:25:00Z',
    updatedAt: '2024-01-15T10:25:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-006',
    section: 'microinverter',
    content: 'Enphase IQ8+ microinverters selected. Homeowner prefers panel-level monitoring and optimization. No central inverter needed.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },

  // Energy Storage notes
  {
    id: 'note-007',
    section: 'energy_storage',
    content: 'Garage wall suitable for battery installation. Concrete floor, temperature controlled. Meets clearance requirements. 240V outlet nearby for future EV charger.',
    createdAt: '2024-01-15T10:45:00Z',
    updatedAt: '2024-01-15T10:45:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-008',
    section: 'powerwall',
    content: 'Two Tesla Powerwall 3 units recommended for whole home backup. Customer approved. Installation on south wall of garage. Adequate space and ventilation.',
    createdAt: '2024-01-15T10:50:00Z',
    updatedAt: '2024-01-15T10:50:00Z',
    createdBy: SURVEYOR,
    isPinned: true,
  },
  {
    id: 'note-009',
    section: 'gateway',
    content: 'WiFi signal strength good at proposed Gateway location. Ethernet backup available if needed. Homeowner has mesh network with 3 access points.',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },

  // Electrical panel notes
  {
    id: 'note-010',
    section: 'string_combiner',
    content: 'Combiner panel location identified next to inverter. Short wire runs. Need weatherproof enclosure - exterior mount.',
    createdAt: '2024-01-15T11:15:00Z',
    updatedAt: '2024-01-15T11:15:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-011',
    section: 'system_combiner',
    content: 'Main system combiner will integrate solar and battery outputs. Located in garage near main panel. Easy access for future maintenance.',
    createdAt: '2024-01-15T11:20:00Z',
    updatedAt: '2024-01-15T11:20:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-012',
    section: 'backup_sub_panel',
    content: 'Critical loads identified: refrigerator, garage door, 5 lighting circuits, home office. Total estimated backup load: 30A. Sub panel location in garage approved by homeowner.',
    createdAt: '2024-01-15T11:25:00Z',
    updatedAt: '2024-01-15T11:25:00Z',
    createdBy: SURVEYOR,
    isPinned: true,
  },

  // BOS notes
  {
    id: 'note-013',
    section: 'bos_1',
    content: 'Utility meter accessible. CT location confirmed with utility requirements. Interconnection point at load side of main breaker.',
    createdAt: '2024-01-15T11:30:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-014',
    section: 'bos_2',
    content: 'Rapid shutdown requirements: Module-level per NEC 2020. IQ8 microinverters satisfy this requirement. No additional RSD equipment needed.',
    createdAt: '2024-01-15T11:35:00Z',
    updatedAt: '2024-01-15T11:35:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
  {
    id: 'note-015',
    section: 'bos_3',
    content: 'Monitoring system will use cellular backup. Primary connection via home WiFi. Enphase Envoy-S with consumption monitoring.',
    createdAt: '2024-01-15T11:40:00Z',
    updatedAt: '2024-01-15T11:40:00Z',
    createdBy: SURVEYOR,
    isPinned: false,
  },
];

// ===== MOCK PHOTOS (Minimal for reference) =====

export const mockPhotos = [
  {
    id: 'photo-001',
    filename: 'roof_south_facing.jpg',
    section: 'solar_panel_1',
    tag: 'overview',
    note: 'Main installation area - south-facing slope',
    uploadedAt: '2024-01-15T09:30:00Z',
    uploadedBy: SURVEYOR.name,
    url: null, // Will use placeholder
    thumbnail_url: null,
  },
  {
    id: 'photo-002',
    filename: 'panel_closeup.jpg',
    section: 'solar_panel_1',
    tag: 'closeup',
    note: 'Shingle condition detail',
    uploadedAt: '2024-01-15T09:32:00Z',
    uploadedBy: SURVEYOR.name,
    url: null,
    thumbnail_url: null,
  },
];

// ===== MOCK VIDEOS (Minimal for reference) =====

export const mockVideos = [
  {
    id: 'video-001',
    filename: 'roof_walkthrough.mp4',
    section: 'solar_panel_1',
    tag: 'overview',
    note: 'Complete roof walkthrough',
    duration: 125,
    uploadedAt: '2024-01-15T09:45:00Z',
    uploadedBy: SURVEYOR.name,
    url: null,
    thumbnail_url: null,
  },
];

// ===== HELPER FUNCTIONS =====

/**
 * Get notes filtered by section
 */
export const getNotesBySection = (sectionId) => {
  return mockSurveyNotes.filter(note => note.section === sectionId);
};

/**
 * Get notes filtered by equipment category
 */
export const getNotesByCategory = (categoryKey) => {
  const category = EQUIPMENT_CATEGORIES[categoryKey];
  if (!category) return [];
  const sectionIds = category.sections.map(s => s.id);
  return mockSurveyNotes.filter(note => sectionIds.includes(note.section));
};

/**
 * Get tag options for a specific section
 */
export const getTagOptionsForSection = (sectionId) => {
  const tagCategory = SECTION_TAG_MAP[sectionId];
  return TAG_OPTIONS[tagCategory] || TAG_OPTIONS.PANEL;
};

/**
 * Get section label from section ID
 */
export const getSectionLabel = (sectionId) => {
  for (const category of Object.values(EQUIPMENT_CATEGORIES)) {
    const section = category.sections.find(s => s.id === sectionId);
    if (section) return section.label;
  }
  return sectionId;
};

/**
 * Get all sections with metadata
 */
export const getAllSections = () => {
  const sections = [];
  Object.entries(EQUIPMENT_CATEGORIES).forEach(([categoryKey, category]) => {
    category.sections.forEach(section => {
      sections.push({
        ...section,
        category: categoryKey,
        categoryLabel: category.label,
        tagOptions: TAG_OPTIONS[SECTION_TAG_MAP[section.id]] || TAG_OPTIONS.PANEL,
      });
    });
  });
  return sections;
};

/**
 * Format timestamp to relative time
 */
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration to MM:SS
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get photos by tag (for backward compatibility)
 */
export const getPhotosByTag = (tag) => {
  if (tag === 'all') return mockPhotos;
  return mockPhotos.filter(photo => photo.tag === tag);
};

/**
 * Get videos by tag (for backward compatibility)
 */
export const getVideosByTag = (tag) => {
  if (tag === 'all') return mockVideos;
  return mockVideos.filter(video => video.tag === tag);
};

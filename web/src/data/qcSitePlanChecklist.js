// Site Plan QC Checklist
// Covers: Property layout, roof, mounting, structural, physical fire setbacks

export const qcSitePlanChecklist = [
  {
    id: 'site-plan',
    title: '1. Site Plan',
    subsections: [
      {
        id: 'property-info',
        title: '1.1 Property Information',
        items: [
          { id: 'sp-boundaries', label: 'Property Boundaries', detail: 'Property lines clearly shown with dimensions' },
          { id: 'sp-north-arrow', label: 'North Arrow', detail: 'Correct orientation indicated' },
          { id: 'sp-scale', label: 'Scale', detail: 'Appropriate scale (1"=10\' or 1"=20\' typical)' },
          { id: 'sp-setbacks', label: 'Setbacks', detail: 'All setback lines shown per local code' },
          { id: 'sp-easements', label: 'Easements', detail: 'Any easements identified and avoided' },
          { id: 'sp-apn', label: 'APN / Lot #', detail: 'Assessor\'s Parcel Number if required' },
        ]
      },
      {
        id: 'existing-structures',
        title: '1.2 Existing Structures',
        items: [
          { id: 'sp-building', label: 'Building Footprint', detail: 'All structures on property shown' },
          { id: 'sp-roof-outline', label: 'Roof Outline', detail: 'Roof edges, ridges, valleys, hips visible' },
          { id: 'sp-existing-elec', label: 'Existing Electrical', detail: 'MSP location, utility meter, service drop shown' },
          { id: 'sp-gas-meter', label: 'Gas Meter', detail: 'Location marked (3\' clearance required)' },
          { id: 'sp-hvac', label: 'HVAC Equipment', detail: 'Rooftop units, condensers located' },
          { id: 'sp-obstructions', label: 'Obstructions', detail: 'Vents, skylights, chimneys, satellite dishes shown' },
        ]
      },
      {
        id: 'pv-location',
        title: '1.3 PV Array Location',
        items: [
          { id: 'sp-array-placement', label: 'Array Placement', detail: 'Module layout clearly visible on roof' },
          { id: 'sp-fire-setbacks', label: 'Fire Setbacks', detail: 'Pathways and setbacks per local fire code' },
          { id: 'sp-conduit-route', label: 'Conduit Routing', detail: 'Pathway from array to inverter to MSP shown' },
          { id: 'sp-equip-locations', label: 'Equipment Locations', detail: 'Inverter, disconnect, combiner locations marked' },
          { id: 'sp-ground-mount', label: 'Ground Mount', detail: 'Foundation locations, equipment pad shown (if applicable)' },
        ]
      }
    ]
  },
  {
    id: 'roof-plan',
    title: '2. Roof Plan & Layout',
    subsections: [
      {
        id: 'roof-info',
        title: '2.1 Roof Information',
        items: [
          { id: 'sp-roof-type', label: 'Roof Type', detail: 'Comp shingle, tile, metal, flat - correctly identified' },
          { id: 'sp-roof-pitch', label: 'Roof Pitch', detail: 'Slope indicated (e.g., 4:12) - matches site photos' },
          { id: 'sp-roof-age', label: 'Roof Age', detail: 'Approximate age noted if known' },
          { id: 'sp-roof-dimensions', label: 'Roof Dimensions', detail: 'Overall dimensions and plane sizes shown' },
          { id: 'sp-roof-planes', label: 'Mounting Planes', detail: 'Each array plane clearly identified' },
          { id: 'sp-azimuth', label: 'Azimuth/Orientation', detail: 'Compass direction of each array plane noted' },
        ]
      },
      {
        id: 'array-layout',
        title: '2.2 Array Layout',
        items: [
          { id: 'sp-module-count', label: 'Module Count Per Plane', detail: 'Number of modules on each roof plane shown' },
          { id: 'sp-module-spacing', label: 'Module Spacing', detail: 'Gap between modules indicated (if applicable)' },
          { id: 'sp-portrait-landscape', label: 'Portrait/Landscape', detail: 'Module orientation clearly shown' },
          { id: 'sp-string-layout', label: 'String Layout', detail: 'String groupings visible (for string inverters)' },
          { id: 'sp-micro-layout', label: 'Microinverter Layout', detail: 'Micro placement shown (if applicable)' },
          { id: 'sp-optimizer-layout', label: 'Optimizer Layout', detail: 'Optimizer placement shown (if applicable)' },
        ]
      },
      {
        id: 'dimensions-setbacks',
        title: '2.3 Dimensions & Setbacks',
        items: [
          { id: 'sp-array-dims', label: 'Array Dimensions', detail: 'Length × width of each array section' },
          { id: 'sp-edge-setbacks', label: 'Edge Setbacks', detail: 'Distance from roof edges to array' },
          { id: 'sp-obstruction-clearance', label: 'Obstruction Clearance', detail: 'Distance from vents, skylights, etc.' },
          { id: 'sp-row-spacing', label: 'Row Spacing', detail: 'Gap between rows (if multiple rows)' },
          { id: 'sp-ridge-distance', label: 'Ridge Distance', detail: 'Setback from roof ridge shown' },
          { id: 'sp-eave-distance', label: 'Eave Distance', detail: 'Setback from eave/drip edge shown' },
        ]
      }
    ]
  },
  {
    id: 'structural',
    title: '3. Structural',
    subsections: [
      {
        id: 'roof-structure',
        title: '3.1 Roof Structure',
        items: [
          { id: 'sp-rafter-spacing', label: 'Rafter/Truss Spacing', detail: 'Typically 16" or 24" OC verified' },
          { id: 'sp-rafter-size', label: 'Rafter Size', detail: 'Lumber dimensions (e.g., 2×6, 2×8)' },
          { id: 'sp-sheathing', label: 'Sheathing Type', detail: 'OSB or plywood, thickness if known' },
          { id: 'sp-rafter-direction', label: 'Rafter Direction', detail: 'Direction of rafters shown on plan' },
        ]
      },
      {
        id: 'mounting',
        title: '3.2 Mounting System',
        items: [
          { id: 'sp-rack-mfg', label: 'Manufacturer', detail: 'Rail/racking manufacturer identified' },
          { id: 'sp-attach-type', label: 'Attachment Type', detail: 'Lag bolt, flashing mount, S-5 clamp, etc.' },
          { id: 'sp-attach-pattern', label: 'Attachment Pattern', detail: 'Spacing and layout per engineering letter' },
          { id: 'sp-attach-hardware', label: 'Attachment Hardware', detail: 'Lag size and length specified (e.g., 5/16" × 4")' },
          { id: 'sp-flashing', label: 'Flashing/Waterproof', detail: 'Method shown (deck seal, comp flashing, etc.)' },
          { id: 'sp-clamps', label: 'Module Clamps', detail: 'Mid/end clamps appropriate for module frame' },
          { id: 'sp-rail-layout', label: 'Rail Layout', detail: 'Rail positions and spans shown' },
          { id: 'sp-splice-locations', label: 'Splice Locations', detail: 'Rail splices positioned over rafters' },
        ]
      },
      {
        id: 'attachment-detail',
        title: '3.3 Attachment Details',
        items: [
          { id: 'sp-attach-qty', label: 'Attachment Quantity', detail: 'Total number of roof attachments shown' },
          { id: 'sp-attach-spacing', label: 'Attachment Spacing', detail: 'Max spacing per engineering (typically 48" OC)' },
          { id: 'sp-embed-depth', label: 'Embedment Depth', detail: 'Lag penetration into rafter specified' },
          { id: 'sp-pilot-hole', label: 'Pilot Hole', detail: 'Pilot hole size noted if required' },
          { id: 'sp-sealant', label: 'Sealant', detail: 'Sealant type and application method noted' },
        ]
      },
      {
        id: 'loads',
        title: '3.4 Load Calculations',
        items: [
          { id: 'sp-dead-load', label: 'Dead Load', detail: 'Weight of system (psf) - typically 2.5-4 psf' },
          { id: 'sp-wind-load', label: 'Wind Load', detail: 'Design wind speed (mph) per ASCE 7' },
          { id: 'sp-exposure', label: 'Exposure Category', detail: 'B, C, or D - matches site conditions' },
          { id: 'sp-snow-load', label: 'Snow Load', detail: 'Ground snow load (psf) if applicable' },
          { id: 'sp-seismic', label: 'Seismic Design', detail: 'SDC category if required' },
          { id: 'sp-eng-letter', label: 'Engineering Letter', detail: 'Stamped letter included or referenced' },
        ]
      },
      {
        id: 'ground-mount-struct',
        title: '3.5 Ground Mount (if applicable)',
        items: [
          { id: 'sp-foundation-type', label: 'Foundation Type', detail: 'Driven pile, concrete pier, ground screw, ballast' },
          { id: 'sp-embedment', label: 'Embedment Depth', detail: 'Depth per engineering calculations' },
          { id: 'sp-foundation-spacing', label: 'Foundation Spacing', detail: 'Post spacing per structural design' },
          { id: 'sp-equip-pad', label: 'Equipment Pad', detail: 'Concrete pad size/thickness for inverter' },
        ]
      }
    ]
  },
  {
    id: 'fire-access',
    title: '4. Fire Access & Pathways',
    subsections: [
      {
        id: 'pathways',
        title: '4.1 Access Pathways (2021 IFC/IRC)',
        items: [
          { id: 'sp-ridge-setback', label: 'Ridge Setback', detail: '3 ft from ridge on both sides (hip/gable)' },
          { id: 'sp-eave-setback', label: 'Eave Setback', detail: 'Module setback from eave per AHJ (often 0-18")' },
          { id: 'sp-pathway-width', label: 'Pathway Width', detail: '36" minimum clear pathway' },
          { id: 'sp-pathway-location', label: 'Pathway Location', detail: 'From eave to ridge (or alternative AHJ approved)' },
          { id: 'sp-smoke-vent', label: 'Smoke Vent Area', detail: 'Array sections ≤ 150 ft or per AHJ' },
          { id: 'sp-valley-setback', label: 'Valley Setback', detail: 'Setback from valleys if required' },
        ]
      },
      {
        id: 'obstruction-setbacks',
        title: '4.2 Setbacks from Obstructions',
        items: [
          { id: 'sp-skylight-setback', label: 'Skylights', detail: '4 ft clearance on all sides' },
          { id: 'sp-vent-setback', label: 'Roof Vents', detail: 'Clearance per AHJ (typically 1-3 ft)' },
          { id: 'sp-hvac-setback', label: 'HVAC Equipment', detail: 'Clearance for service access' },
          { id: 'sp-chimney-setback', label: 'Chimneys', detail: 'Clearance per fire code (typically 3 ft)' },
          { id: 'sp-antenna-setback', label: 'Antennas/Dishes', detail: 'Clearance from communication equipment' },
        ]
      }
    ]
  },
  {
    id: 'symbols-legend',
    title: '5. Symbols & Legend',
    subsections: [
      {
        id: 'plan-symbols',
        title: '5.1 Plan Symbols',
        items: [
          { id: 'sp-module-symbol', label: 'Module Symbol', detail: 'PV module representation clear and consistent' },
          { id: 'sp-inverter-symbol', label: 'Inverter Symbol', detail: 'Inverter location symbol shown' },
          { id: 'sp-disconnect-symbol', label: 'Disconnect Symbol', detail: 'AC/DC disconnect symbols shown' },
          { id: 'sp-meter-symbol', label: 'Meter Symbol', detail: 'Utility meter location indicated' },
          { id: 'sp-msp-symbol', label: 'MSP Symbol', detail: 'Main service panel symbol shown' },
          { id: 'sp-conduit-symbol', label: 'Conduit Symbol', detail: 'Conduit runs clearly indicated' },
        ]
      },
      {
        id: 'legend',
        title: '5.2 Legend & Notes',
        items: [
          { id: 'sp-legend-present', label: 'Legend Present', detail: 'Symbol legend included on drawing' },
          { id: 'sp-legend-complete', label: 'Legend Complete', detail: 'All symbols used are defined in legend' },
          { id: 'sp-north-arrow-legend', label: 'North Arrow', detail: 'North direction clearly indicated' },
          { id: 'sp-scale-bar', label: 'Scale Bar', detail: 'Graphical scale bar included' },
          { id: 'sp-site-notes', label: 'Site Notes', detail: 'Relevant site-specific notes included' },
        ]
      }
    ]
  },
  {
    id: 'site-quality',
    title: '6. Site Plan Quality',
    subsections: [
      {
        id: 'drawing-quality',
        title: '6.1 Drawing Quality',
        items: [
          { id: 'sp-legibility', label: 'Legibility', detail: 'All text and dimensions readable at scale' },
          { id: 'sp-line-weights', label: 'Line Weights', detail: 'Proper line hierarchy (bold for arrays, light for existing)' },
          { id: 'sp-dimensions-clear', label: 'Dimensions Clear', detail: 'Dimension lines don\'t overlap or conflict' },
          { id: 'sp-hatching', label: 'Hatching/Fill', detail: 'Array areas properly filled or hatched' },
          { id: 'sp-contrast', label: 'Contrast', detail: 'New work distinguishable from existing' },
        ]
      },
      {
        id: 'accuracy',
        title: '6.2 Accuracy Check',
        items: [
          { id: 'sp-matches-satellite', label: 'Matches Satellite', detail: 'Layout matches aerial/satellite imagery' },
          { id: 'sp-matches-photos', label: 'Matches Photos', detail: 'Layout matches site survey photos' },
          { id: 'sp-dimensions-verified', label: 'Dimensions Verified', detail: 'Key dimensions verified against measurements' },
          { id: 'sp-obstruction-verified', label: 'Obstructions Verified', detail: 'All roof obstructions shown match photos' },
        ]
      }
    ]
  }
];

// Helper to count total items
export const getSitePlanChecklistTotal = () => {
  let count = 0;
  qcSitePlanChecklist.forEach(section => {
    section.subsections.forEach(sub => {
      count += sub.items.length;
    });
  });
  return count;
};

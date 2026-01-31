// src/data/qcChecklist.js
// Comprehensive QC (Quality Control) checklist for solar PV plan set review

export const qcChecklist = [
  {
    id: 'cover-sheet',
    title: '1. Cover Sheet & Title Block',
    subsections: [
      {
        id: 'project-info',
        title: '1.1 Project Information',
        items: [
          { id: 'logo', label: 'Company Logo', detail: 'Installer logo present and properly sized' },
          { id: 'address', label: 'Project Address', detail: 'Complete street address, city, state, ZIP matches permit application' },
          { id: 'customer', label: 'Customer Name', detail: 'Matches exactly with utility account and permit application' },
          { id: 'ahj', label: 'AHJ Information', detail: 'Jurisdiction name, permit type, and any special requirements noted' },
          { id: 'utility', label: 'Utility Provider', detail: 'Correct utility company name and service territory' },
          { id: 'project-id', label: 'Project ID', detail: 'Internal project ID / reference number displayed' },
        ]
      },
      {
        id: 'plan-set-info',
        title: '1.2 Plan Set Information',
        items: [
          { id: 'drawing-date', label: 'Drawing Date', detail: 'Current date on all sheets' },
          { id: 'revision', label: 'Revision Number', detail: 'Correct revision # and date (if revised)' },
          { id: 'sheet-index', label: 'Sheet Index', detail: 'All sheets listed with correct descriptions' },
          { id: 'scale', label: 'Scale Notation', detail: 'Scale indicated for each drawing type' },
          { id: 'pe-stamp', label: 'PE Stamp Space', detail: 'Designated area for PE stamp (if required)' },
          { id: 'contractor', label: 'Contractor Info', detail: 'License #, C-10/C-46, address, phone, email' },
        ]
      },
      {
        id: 'system-summary',
        title: '1.3 System Summary',
        items: [
          { id: 'dc-size', label: 'System Size (DC)', detail: 'Total DC watts matches equipment qty × wattage' },
          { id: 'ac-size', label: 'System Size (AC)', detail: 'AC output matches inverter rating(s)' },
          { id: 'dc-ac-ratio', label: 'DC/AC Ratio', detail: 'Calculated and within acceptable range (1.0-1.35)' },
          { id: 'production', label: 'Annual Production', detail: 'kWh estimate shown (if required by AHJ)' },
          { id: 'module-info', label: 'Module Qty & Model', detail: 'Panel count and exact model number' },
          { id: 'inverter-info', label: 'Inverter Qty & Model', detail: 'Inverter count and exact model with firmware' },
          { id: 'battery-info', label: 'Battery (if ESS)', detail: 'Battery model, qty, total kWh capacity' },
        ]
      }
    ]
  },
  {
    id: 'site-plan',
    title: '2. Site Plan',
    subsections: [
      {
        id: 'property-info',
        title: '2.1 Property Information',
        items: [
          { id: 'boundaries', label: 'Property Boundaries', detail: 'Property lines clearly shown with dimensions' },
          { id: 'north-arrow', label: 'North Arrow', detail: 'Correct orientation indicated' },
          { id: 'site-scale', label: 'Scale', detail: 'Appropriate scale (1"=10\' or 1"=20\' typical)' },
          { id: 'setbacks', label: 'Setbacks', detail: 'All setback lines shown per local code' },
          { id: 'easements', label: 'Easements', detail: 'Any easements identified and avoided' },
          { id: 'apn', label: 'APN / Lot #', detail: 'Assessor\'s Parcel Number if required' },
        ]
      },
      {
        id: 'existing-structures',
        title: '2.2 Existing Structures',
        items: [
          { id: 'building', label: 'Building Footprint', detail: 'All structures on property shown' },
          { id: 'roof-outline', label: 'Roof Outline', detail: 'Roof edges, ridges, valleys, hips visible' },
          { id: 'existing-elec', label: 'Existing Electrical', detail: 'MSP location, utility meter, service drop shown' },
          { id: 'gas-meter', label: 'Gas Meter', detail: 'Location marked (3\' clearance required)' },
          { id: 'hvac', label: 'HVAC Equipment', detail: 'Rooftop units, condensers located' },
          { id: 'obstructions', label: 'Obstructions', detail: 'Vents, skylights, chimneys, satellite dishes shown' },
        ]
      },
      {
        id: 'pv-location',
        title: '2.3 PV Array Location',
        items: [
          { id: 'array-placement', label: 'Array Placement', detail: 'Module layout clearly visible on roof' },
          { id: 'fire-setbacks', label: 'Fire Setbacks', detail: 'Pathways and setbacks per local fire code' },
          { id: 'conduit-route', label: 'Conduit Routing', detail: 'Pathway from array to inverter to MSP shown' },
          { id: 'equip-locations', label: 'Equipment Locations', detail: 'Inverter, disconnect, combiner locations marked' },
          { id: 'ground-mount', label: 'Ground Mount', detail: 'Foundation locations, equipment pad shown (if applicable)' },
        ]
      }
    ]
  },
  {
    id: 'single-line',
    title: '3. Single Line Diagram',
    subsections: [
      {
        id: 'pv-source',
        title: '3.1 PV Source Circuits',
        items: [
          { id: 'string-config', label: 'String Configuration', detail: '# of modules per string clearly shown' },
          { id: 'string-voltage', label: 'String Voltage', detail: 'Voc and Vmp at lowest temp within inverter limits' },
          { id: 'string-current', label: 'String Current', detail: 'Isc and Imp shown, within conductor/OCPD rating' },
          { id: 'module-specs', label: 'Module Specs', detail: 'Voc, Vmp, Isc, Imp, Pmax at STC shown' },
          { id: 'conductor-size', label: 'Conductor Sizing', detail: 'Wire gauge shown (typically #10 or #12 USE-2/PV Wire)' },
          { id: 'dc-ocpd', label: 'OCPD (if required)', detail: 'Fuse size matches module series fuse rating' },
        ]
      },
      {
        id: 'inverter-section',
        title: '3.2 Inverter Section',
        items: [
          { id: 'inv-symbol', label: 'Inverter Symbol', detail: 'Correct symbol with model # labeled' },
          { id: 'dc-input', label: 'DC Input Specs', detail: 'Max Vdc, operating voltage range, max Idc' },
          { id: 'ac-output', label: 'AC Output Specs', detail: 'Rated AC watts, voltage, max continuous current' },
          { id: 'mppt', label: 'MPPT Channels', detail: 'Number of MPPT inputs and string assignment' },
          { id: 'rapid-shutdown', label: 'Rapid Shutdown', detail: 'NEC 690.12 compliant method indicated' },
          { id: 'gfdi', label: 'Ground Fault', detail: 'GFDI protection shown or noted as integral' },
        ]
      },
      {
        id: 'ac-output-circuit',
        title: '3.3 AC Output Circuit',
        items: [
          { id: 'ac-disconnect', label: 'AC Disconnect', detail: 'Location, rating (if external required)' },
          { id: 'ac-conductor', label: 'Conductor Sizing', detail: 'Wire size adequate for continuous output (125% rule)' },
          { id: 'conduit-type', label: 'Conduit Type/Size', detail: 'EMT, PVC, flex - appropriate for application' },
          { id: 'ocpd-msp', label: 'OCPD at MSP', detail: 'Breaker size ≤ inverter max OCPD rating' },
          { id: 'connection-type', label: 'Connection Type', detail: 'Load side (120% rule) or supply side tap indicated' },
        ]
      },
      {
        id: 'interconnection',
        title: '3.4 Interconnection',
        items: [
          { id: 'panel-rating', label: 'Main Panel Rating', detail: 'Bus rating shown (e.g., 200A)' },
          { id: 'main-breaker', label: 'Main Breaker Size', detail: 'Main OCPD rating shown' },
          { id: '120-rule', label: '120% Rule Calc', detail: 'Bus × 120% ≥ Main + PV breaker' },
          { id: 'backfeed', label: 'Backfeed Breaker', detail: 'PV breaker at opposite end from main' },
          { id: 'afc', label: 'Available Fault Current', detail: 'AFC shown if required by AHJ' },
        ]
      },
      {
        id: 'ess',
        title: '3.5 Energy Storage (if applicable)',
        items: [
          { id: 'battery-specs', label: 'Battery Specs', detail: 'Model, voltage, capacity (kWh), chemistry' },
          { id: 'backup-panel', label: 'Backup Loads Panel', detail: 'Critical loads panel shown if partial backup' },
          { id: 'transfer-switch', label: 'Transfer Switch', detail: 'ATS or integrated transfer shown' },
          { id: 'battery-ocpd', label: 'Battery OCPD', detail: 'DC breaker/fuse size per manufacturer' },
          { id: 'islanding', label: 'Islanding Protection', detail: 'Anti-islanding method noted' },
        ]
      }
    ]
  },
  {
    id: 'three-line',
    title: '4. Three-Line Diagram',
    subsections: [
      {
        id: 'conductor-details',
        title: '4.1 Conductor Details',
        items: [
          { id: 'phase-conductors', label: 'Phase Conductors', detail: 'All phases shown (L1, L2, N) with sizes' },
          { id: 'egc', label: 'Equipment Ground', detail: 'EGC size matches NEC 250.122 / Table 690.45' },
          { id: 'gec', label: 'Grounding Electrode', detail: 'GEC to ground rod or UFER shown' },
          { id: 'neutral', label: 'Neutral Required?', detail: 'Neutral shown only where needed' },
          { id: 'wire-colors', label: 'Wire Colors', detail: 'Color coding indicated or noted per NEC' },
        ]
      },
      {
        id: 'protection',
        title: '4.2 Protection Devices',
        items: [
          { id: 'all-ocpd', label: 'All OCPDs Shown', detail: 'Every breaker/fuse with amp rating' },
          { id: 'gfci-afci', label: 'GFCI/AFCI', detail: 'Required protection shown where applicable' },
          { id: 'spd', label: 'Surge Protection', detail: 'SPD location if required/provided' },
          { id: 'dc-disc', label: 'DC Disconnect', detail: 'Rapid shutdown initiator location shown' },
        ]
      }
    ]
  },
  {
    id: 'structural',
    title: '5. Structural',
    subsections: [
      {
        id: 'roof-info',
        title: '5.1 Roof Information',
        items: [
          { id: 'roof-type', label: 'Roof Type', detail: 'Comp shingle, tile, metal, flat - correctly identified' },
          { id: 'roof-pitch', label: 'Roof Pitch', detail: 'Slope indicated (e.g., 4:12) - matches site photos' },
          { id: 'roof-age', label: 'Roof Age', detail: 'Approximate age noted if known' },
          { id: 'rafter-spacing', label: 'Rafter/Truss Spacing', detail: 'Typically 16" or 24" OC verified' },
          { id: 'rafter-size', label: 'Rafter Size', detail: 'Lumber dimensions (e.g., 2×6, 2×8)' },
          { id: 'sheathing', label: 'Sheathing Type', detail: 'OSB or plywood, thickness if known' },
        ]
      },
      {
        id: 'mounting',
        title: '5.2 Mounting System',
        items: [
          { id: 'rack-mfg', label: 'Manufacturer', detail: 'Rail/racking manufacturer identified' },
          { id: 'attach-type', label: 'Attachment Type', detail: 'Lag bolt, flashing mount, S-5 clamp, etc.' },
          { id: 'attach-pattern', label: 'Attachment Pattern', detail: 'Spacing and layout per engineering letter' },
          { id: 'attach-hardware', label: 'Attachment Hardware', detail: 'Lag size and length specified' },
          { id: 'flashing', label: 'Flashing/Waterproof', detail: 'Method shown (deck seal, comp flashing, etc.)' },
          { id: 'clamps', label: 'Module Clamps', detail: 'Mid/end clamps appropriate for module frame' },
        ]
      },
      {
        id: 'loads',
        title: '5.3 Load Calculations',
        items: [
          { id: 'dead-load', label: 'Dead Load', detail: 'Weight of system (psf) - typically 2.5-4 psf' },
          { id: 'wind-load', label: 'Wind Load', detail: 'Design wind speed (mph) per ASCE 7' },
          { id: 'exposure', label: 'Exposure Category', detail: 'B, C, or D - matches site conditions' },
          { id: 'snow-load', label: 'Snow Load', detail: 'Ground snow load (psf) if applicable' },
          { id: 'seismic', label: 'Seismic Design', detail: 'SDC category if required' },
          { id: 'eng-letter', label: 'Engineering Letter', detail: 'Stamped letter included or referenced' },
        ]
      },
      {
        id: 'ground-mount-struct',
        title: '5.4 Ground Mount (if applicable)',
        items: [
          { id: 'foundation-type', label: 'Foundation Type', detail: 'Driven pile, concrete pier, ground screw, ballast' },
          { id: 'embedment', label: 'Embedment Depth', detail: 'Depth per engineering calculations' },
          { id: 'foundation-spacing', label: 'Foundation Spacing', detail: 'Post spacing per structural design' },
          { id: 'equip-pad', label: 'Equipment Pad', detail: 'Concrete pad size/thickness for inverter' },
        ]
      }
    ]
  },
  {
    id: 'fire-safety',
    title: '6. Fire Safety & Setbacks',
    subsections: [
      {
        id: 'pathways',
        title: '6.1 Access Pathways (2021 IFC/IRC)',
        items: [
          { id: 'ridge-setback', label: 'Ridge Setback', detail: '3 ft from ridge on both sides (hip/gable)' },
          { id: 'eave-setback', label: 'Eave Setback', detail: 'Module setback from eave per AHJ (often 0-18")' },
          { id: 'pathway-width', label: 'Pathway Width', detail: '36" minimum clear pathway' },
          { id: 'pathway-location', label: 'Pathway Location', detail: 'From eave to ridge (or alternative AHJ approved)' },
          { id: 'smoke-vent', label: 'Smoke Vent Area', detail: 'Array sections ≤ 150 ft or per AHJ' },
        ]
      },
      {
        id: 'obstruction-setbacks',
        title: '6.2 Setbacks from Obstructions',
        items: [
          { id: 'skylight-setback', label: 'Skylights', detail: '4 ft clearance on all sides' },
          { id: 'vent-setback', label: 'Roof Vents', detail: 'Clearance per AHJ (typically 1-3 ft)' },
          { id: 'hvac-setback', label: 'HVAC Equipment', detail: 'Clearance for service access' },
          { id: 'chimney-setback', label: 'Chimneys', detail: 'Clearance per fire code (typically 3 ft)' },
        ]
      },
      {
        id: 'rapid-shutdown-req',
        title: '6.3 Rapid Shutdown (NEC 690.12)',
        items: [
          { id: 'initiation', label: 'Initiation Point', detail: 'Location of rapid shutdown initiator shown' },
          { id: 'array-boundary', label: 'Array Boundary', detail: 'Controlled conductors within array boundary' },
          { id: 'voltage-limits', label: 'Voltage Limits', detail: '≤80V within 30 sec, ≤30V within 30 sec (2017+)' },
          { id: 'listed-equip', label: 'Listed Equipment', detail: 'PVRSS components listed to UL 1741' },
        ]
      },
      {
        id: 'labels',
        title: '6.4 Labeling Requirements',
        items: [
          { id: 'main-label', label: 'Main Service Label', detail: 'DC voltage warning at service disconnect' },
          { id: 'pv-disc-label', label: 'PV Disconnect Label', detail: 'Rated voltage/current, "PV SYSTEM DISCONNECT"' },
          { id: 'inv-label', label: 'Inverter Label', detail: 'AC/DC ratings, emergency shutdown procedure' },
          { id: 'conduit-labels', label: 'Conduit Labels', detail: '"PHOTOVOLTAIC POWER SOURCE" labels' },
          { id: 'rs-label', label: 'Rapid Shutdown Label', detail: 'Per 690.56(C) at service entrance' },
          { id: 'directory', label: 'Directory', detail: 'Circuit directory showing PV connection point' },
          { id: 'gm-sign', label: 'Ground Mount Sign', detail: '"DANGER - HIGH VOLTAGE" if accessible' },
        ]
      }
    ]
  },
  {
    id: 'code-compliance',
    title: '7. Code Compliance',
    subsections: [
      {
        id: 'codes',
        title: '7.1 Applicable Codes',
        items: [
          { id: 'nec-version', label: 'NEC Version', detail: '2017, 2020, 2023 - Article 690, 705, 706' },
          { id: 'ibc-version', label: 'IBC/IRC Version', detail: 'Structural requirements' },
          { id: 'ifc-version', label: 'IFC Version', detail: 'Fire setback and access requirements' },
          { id: 'asce-version', label: 'ASCE 7 Version', detail: 'Wind/seismic/snow load design' },
          { id: 'local-amend', label: 'Local Amendments', detail: 'Any AHJ-specific requirements noted' },
        ]
      },
      {
        id: 'listings',
        title: '7.2 Equipment Listings',
        items: [
          { id: 'module-listing', label: 'Modules', detail: 'UL 61730 (or UL 1703) listed' },
          { id: 'inv-listing', label: 'Inverters', detail: 'UL 1741 listed, IEEE 1547 compliant' },
          { id: 'rs-listing', label: 'Rapid Shutdown', detail: 'UL 1741 listed PVRSS' },
          { id: 'batt-listing', label: 'Batteries', detail: 'UL 9540 listed (if ESS)' },
          { id: 'rack-listing', label: 'Racking', detail: 'UL 2703 listed' },
          { id: 'disc-listing', label: 'Disconnects', detail: 'UL listed for DC application' },
        ]
      },
      {
        id: 'utility-req',
        title: '7.3 Utility Requirements',
        items: [
          { id: 'interconnect-app', label: 'Interconnection App', detail: 'Utility application submitted/approved' },
          { id: 'size-limit', label: 'System Size Limit', detail: 'Within utility program limits' },
          { id: 'meter-req', label: 'Meter Requirements', detail: 'Net meter, production meter requirements' },
          { id: 'ext-disc', label: 'External Disconnect', detail: 'Utility-accessible AC disconnect if required' },
          { id: 'insurance', label: 'Insurance/Bonding', detail: 'Documentation if required by utility' },
        ]
      }
    ]
  },
  {
    id: 'calculations',
    title: '8. Design Calculations',
    subsections: [
      {
        id: 'string-sizing',
        title: '8.1 String Sizing',
        items: [
          { id: 'max-string-v', label: 'Max String Voltage', detail: 'Voc × # modules × temp correction ≤ inverter max Vdc' },
          { id: 'min-string-v', label: 'Min String Voltage', detail: 'Vmp × # modules × temp correction ≥ inverter min MPPT' },
          { id: 'temp-correction', label: 'Temp Correction', detail: 'Using correct low/high temps for location' },
          { id: 'voltage-window', label: 'Voltage Window', detail: 'Operating voltage within MPPT range' },
        ]
      },
      {
        id: 'conductor-sizing',
        title: '8.2 Conductor Sizing',
        items: [
          { id: 'ampacity', label: 'Ampacity Calc', detail: 'NEC 310.15 with applicable correction factors' },
          { id: 'dc-156', label: 'DC: Isc × 1.56', detail: 'Conductor sized for 1.56 × Isc' },
          { id: 'ac-125', label: 'AC: Imax × 1.25', detail: 'Conductor sized for 1.25 × max continuous' },
          { id: 'vdrop', label: 'Voltage Drop', detail: '≤3% recommended (≤2% ideal)' },
          { id: 'temp-derate', label: 'Temp Derating', detail: 'Applied for roof/ambient conditions' },
          { id: 'conduit-fill', label: 'Conduit Fill', detail: '≤40% fill for 3+ conductors' },
        ]
      },
      {
        id: 'ocpd-sizing',
        title: '8.3 OCPD Sizing',
        items: [
          { id: 'dc-ocpd-calc', label: 'DC OCPD', detail: '≥1.56 × Isc per string (if required)' },
          { id: 'ac-breaker-calc', label: 'AC Breaker', detail: '≤ inverter max OCPD, ≥1.25 × Imax' },
          { id: '120-rule-calc', label: '120% Rule', detail: '(Main + PV) ≤ 1.2 × busbar rating' },
          { id: 'supply-tap', label: 'Supply Side Tap', detail: 'Per 705.12(B)(2) if applicable' },
        ]
      },
      {
        id: 'grounding-calc',
        title: '8.4 Grounding',
        items: [
          { id: 'egc-sizing', label: 'EGC Sizing', detail: 'Per NEC 250.122 or 690.45' },
          { id: 'gec-sizing', label: 'GEC Sizing', detail: 'Per NEC 250.66 based on service size' },
          { id: 'bonding', label: 'Bonding', detail: 'Modules, rails, inverter properly bonded' },
        ]
      }
    ]
  },
  {
    id: 'documentation',
    title: '9. Documentation',
    subsections: [
      {
        id: 'spec-sheets',
        title: '9.1 Spec Sheets',
        items: [
          { id: 'module-spec', label: 'Module Datasheet', detail: 'Current spec sheet matching model on plans' },
          { id: 'inv-spec', label: 'Inverter Datasheet', detail: 'Current spec sheet with firmware version' },
          { id: 'batt-spec', label: 'Battery Datasheet', detail: 'Spec sheet and installation manual (if ESS)' },
          { id: 'rack-spec', label: 'Racking Cut Sheet', detail: 'Attachment details and engineering' },
          { id: 'opt-spec', label: 'Optimizer Datasheet', detail: 'If using DC optimizers' },
        ]
      },
      {
        id: 'engineering',
        title: '9.2 Engineering',
        items: [
          { id: 'struct-letter', label: 'Structural Letter', detail: 'PE stamped letter for roof attachment' },
          { id: 'elec-calcs', label: 'Electrical Calcs', detail: 'PE stamped if required by AHJ' },
          { id: 'wind-snow', label: 'Wind/Snow Calcs', detail: 'Design loads documented' },
        ]
      },
      {
        id: 'site-docs',
        title: '9.3 Site Documentation',
        items: [
          { id: 'utility-bill', label: 'Utility Bill', detail: 'Recent bill showing meter # and service address' },
          { id: 'site-photos', label: 'Site Photos', detail: 'Roof, MSP, meter, proposed equipment locations' },
          { id: 'msp-photo', label: 'MSP Photo', detail: 'Clear photo of panel schedule and main breaker' },
          { id: 'satellite', label: 'Satellite Image', detail: 'Current aerial for roof layout reference' },
        ]
      }
    ]
  },
  {
    id: 'final-review',
    title: '10. Final Review',
    subsections: [
      {
        id: 'drawing-quality',
        title: '10.1 Drawing Quality',
        items: [
          { id: 'legibility', label: 'Legibility', detail: 'All text readable at scale, not overlapping' },
          { id: 'consistency', label: 'Consistency', detail: 'Equipment names match across all sheets' },
          { id: 'dimensions', label: 'Dimensions', detail: 'Critical dimensions shown and verified' },
          { id: 'spelling', label: 'Spelling/Grammar', detail: 'No typos in labels or notes' },
          { id: 'line-weights', label: 'Line Weights', detail: 'Clear hierarchy, proper symbols' },
        ]
      },
      {
        id: 'cross-reference',
        title: '10.2 Cross-Reference Check',
        items: [
          { id: 'module-count', label: 'Module Count', detail: 'Site plan qty = single line qty = cover sheet qty' },
          { id: 'inv-count', label: 'Inverter Count', detail: 'Consistent across all sheets' },
          { id: 'system-size-check', label: 'System Size', detail: 'DC/AC watts match calculations and spec sheets' },
          { id: 'wire-size-check', label: 'Wire Sizes', detail: 'Match between single line and three line' },
          { id: 'breaker-check', label: 'Breaker Sizes', detail: 'Match single line and panel schedule' },
        ]
      },
      {
        id: 'ahj-specific',
        title: '10.3 AHJ-Specific Items',
        items: [
          { id: 'special-req', label: 'Special Requirements', detail: 'Any AHJ-specific notes or details addressed' },
          { id: 'redlines', label: 'Plan Check Comments', detail: 'Previous redline items corrected (if resubmit)' },
          { id: 'permit-forms', label: 'Permit Forms', detail: 'Correct application forms completed' },
        ]
      }
    ]
  }
];

// Helper to count total items
export const getTotalChecklistItems = () => {
  let count = 0;
  qcChecklist.forEach(section => {
    section.subsections.forEach(sub => {
      count += sub.items.length;
    });
  });
  return count;
};

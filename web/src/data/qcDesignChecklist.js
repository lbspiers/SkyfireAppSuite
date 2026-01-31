// Design QC Checklist
// Covers: Cover sheet, electrical diagrams, calculations, code compliance, documentation

export const qcDesignChecklist = [
  {
    id: 'cover-sheet',
    title: '1. Cover Sheet & Title Block',
    subsections: [
      {
        id: 'project-info',
        title: '1.1 Project Information',
        items: [
          { id: 'dq-logo', label: 'Company Logo', detail: 'Installer logo present and properly sized' },
          { id: 'dq-address', label: 'Project Address', detail: 'Complete street address, city, state, ZIP matches permit application' },
          { id: 'dq-customer', label: 'Customer Name', detail: 'Matches exactly with utility account and permit application' },
          { id: 'dq-ahj', label: 'AHJ Information', detail: 'Jurisdiction name, permit type, and any special requirements noted' },
          { id: 'dq-utility', label: 'Utility Provider', detail: 'Correct utility company name and service territory' },
          { id: 'dq-project-id', label: 'Project ID', detail: 'Internal project ID / reference number displayed' },
        ]
      },
      {
        id: 'plan-set-info',
        title: '1.2 Plan Set Information',
        items: [
          { id: 'dq-drawing-date', label: 'Drawing Date', detail: 'Current date on all sheets' },
          { id: 'dq-revision', label: 'Revision Number', detail: 'Correct revision # and date (if revised)' },
          { id: 'dq-sheet-index', label: 'Sheet Index', detail: 'All sheets listed with correct descriptions' },
          { id: 'dq-scale', label: 'Scale Notation', detail: 'Scale indicated for each drawing type' },
          { id: 'dq-pe-stamp', label: 'PE Stamp Space', detail: 'Designated area for PE stamp (if required)' },
          { id: 'dq-contractor', label: 'Contractor Info', detail: 'License #, C-10/C-46, address, phone, email' },
        ]
      },
      {
        id: 'system-summary',
        title: '1.3 System Summary',
        items: [
          { id: 'dq-dc-size', label: 'System Size (DC)', detail: 'Total DC watts matches equipment qty × wattage' },
          { id: 'dq-ac-size', label: 'System Size (AC)', detail: 'AC output matches inverter rating(s)' },
          { id: 'dq-dc-ac-ratio', label: 'DC/AC Ratio', detail: 'Calculated and within acceptable range (1.0-1.35)' },
          { id: 'dq-production', label: 'Annual Production', detail: 'kWh estimate shown (if required by AHJ)' },
          { id: 'dq-module-info', label: 'Module Qty & Model', detail: 'Panel count and exact model number' },
          { id: 'dq-inverter-info', label: 'Inverter Qty & Model', detail: 'Inverter count and exact model with firmware' },
          { id: 'dq-battery-info', label: 'Battery (if ESS)', detail: 'Battery model, qty, total kWh capacity' },
        ]
      }
    ]
  },
  {
    id: 'single-line',
    title: '2. Single Line Diagram',
    subsections: [
      {
        id: 'pv-source',
        title: '2.1 PV Source Circuits',
        items: [
          { id: 'dq-string-config', label: 'String Configuration', detail: '# of modules per string clearly shown' },
          { id: 'dq-string-voltage', label: 'String Voltage', detail: 'Voc and Vmp at lowest temp within inverter limits' },
          { id: 'dq-string-current', label: 'String Current', detail: 'Isc and Imp shown, within conductor/OCPD rating' },
          { id: 'dq-module-specs', label: 'Module Specs', detail: 'Voc, Vmp, Isc, Imp, Pmax at STC shown' },
          { id: 'dq-dc-conductor', label: 'DC Conductor Sizing', detail: 'Wire gauge shown (typically #10 or #12 USE-2/PV Wire)' },
          { id: 'dq-dc-ocpd', label: 'DC OCPD (if required)', detail: 'Fuse size matches module series fuse rating' },
        ]
      },
      {
        id: 'inverter-section',
        title: '2.2 Inverter Section',
        items: [
          { id: 'dq-inv-symbol', label: 'Inverter Symbol', detail: 'Correct symbol with model # labeled' },
          { id: 'dq-dc-input', label: 'DC Input Specs', detail: 'Max Vdc, operating voltage range, max Idc' },
          { id: 'dq-ac-output', label: 'AC Output Specs', detail: 'Rated AC watts, voltage, max continuous current' },
          { id: 'dq-mppt', label: 'MPPT Channels', detail: 'Number of MPPT inputs and string assignment' },
          { id: 'dq-rapid-shutdown', label: 'Rapid Shutdown', detail: 'NEC 690.12 compliant method indicated' },
          { id: 'dq-gfdi', label: 'Ground Fault', detail: 'GFDI protection shown or noted as integral' },
        ]
      },
      {
        id: 'ac-output-circuit',
        title: '2.3 AC Output Circuit',
        items: [
          { id: 'dq-ac-disconnect', label: 'AC Disconnect', detail: 'Location, rating (if external required)' },
          { id: 'dq-ac-conductor', label: 'AC Conductor Sizing', detail: 'Wire size adequate for continuous output (125% rule)' },
          { id: 'dq-conduit-type', label: 'Conduit Type/Size', detail: 'EMT, PVC, flex - appropriate for application' },
          { id: 'dq-ocpd-msp', label: 'OCPD at MSP', detail: 'Breaker size ≤ inverter max OCPD rating' },
          { id: 'dq-connection-type', label: 'Connection Type', detail: 'Load side (120% rule) or supply side tap indicated' },
        ]
      },
      {
        id: 'interconnection',
        title: '2.4 Interconnection',
        items: [
          { id: 'dq-panel-rating', label: 'Main Panel Rating', detail: 'Bus rating shown (e.g., 200A)' },
          { id: 'dq-main-breaker', label: 'Main Breaker Size', detail: 'Main OCPD rating shown' },
          { id: 'dq-120-rule', label: '120% Rule Calc', detail: 'Bus × 120% ≥ Main + PV breaker' },
          { id: 'dq-backfeed', label: 'Backfeed Breaker', detail: 'PV breaker at opposite end from main' },
          { id: 'dq-afc', label: 'Available Fault Current', detail: 'AFC shown if required by AHJ' },
        ]
      },
      {
        id: 'ess',
        title: '2.5 Energy Storage (if applicable)',
        items: [
          { id: 'dq-battery-specs', label: 'Battery Specs', detail: 'Model, voltage, capacity (kWh), chemistry' },
          { id: 'dq-backup-panel', label: 'Backup Loads Panel', detail: 'Critical loads panel shown if partial backup' },
          { id: 'dq-transfer-switch', label: 'Transfer Switch', detail: 'ATS or integrated transfer shown' },
          { id: 'dq-battery-ocpd', label: 'Battery OCPD', detail: 'DC breaker/fuse size per manufacturer' },
          { id: 'dq-islanding', label: 'Islanding Protection', detail: 'Anti-islanding method noted' },
        ]
      }
    ]
  },
  {
    id: 'three-line',
    title: '3. Three-Line Diagram',
    subsections: [
      {
        id: 'conductor-details',
        title: '3.1 Conductor Details',
        items: [
          { id: 'dq-phase-conductors', label: 'Phase Conductors', detail: 'All phases shown (L1, L2, N) with sizes' },
          { id: 'dq-egc', label: 'Equipment Ground', detail: 'EGC size matches NEC 250.122 / Table 690.45' },
          { id: 'dq-gec', label: 'Grounding Electrode', detail: 'GEC to ground rod or UFER shown' },
          { id: 'dq-neutral', label: 'Neutral Required?', detail: 'Neutral shown only where needed' },
          { id: 'dq-wire-colors', label: 'Wire Colors', detail: 'Color coding indicated or noted per NEC' },
        ]
      },
      {
        id: 'protection',
        title: '3.2 Protection Devices',
        items: [
          { id: 'dq-all-ocpd', label: 'All OCPDs Shown', detail: 'Every breaker/fuse with amp rating' },
          { id: 'dq-gfci-afci', label: 'GFCI/AFCI', detail: 'Required protection shown where applicable' },
          { id: 'dq-spd', label: 'Surge Protection', detail: 'SPD location if required/provided' },
          { id: 'dq-dc-disc', label: 'DC Disconnect', detail: 'Rapid shutdown initiator location shown' },
        ]
      }
    ]
  },
  {
    id: 'calculations',
    title: '4. Design Calculations',
    subsections: [
      {
        id: 'string-sizing',
        title: '4.1 String Sizing',
        items: [
          { id: 'dq-max-string-v', label: 'Max String Voltage', detail: 'Voc × # modules × temp correction ≤ inverter max Vdc' },
          { id: 'dq-min-string-v', label: 'Min String Voltage', detail: 'Vmp × # modules × temp correction ≥ inverter min MPPT' },
          { id: 'dq-temp-correction', label: 'Temp Correction', detail: 'Using correct low/high temps for location' },
          { id: 'dq-voltage-window', label: 'Voltage Window', detail: 'Operating voltage within MPPT range' },
        ]
      },
      {
        id: 'conductor-sizing',
        title: '4.2 Conductor Sizing',
        items: [
          { id: 'dq-ampacity', label: 'Ampacity Calc', detail: 'NEC 310.15 with applicable correction factors' },
          { id: 'dq-dc-156', label: 'DC: Isc × 1.56', detail: 'Conductor sized for 1.56 × Isc' },
          { id: 'dq-ac-125', label: 'AC: Imax × 1.25', detail: 'Conductor sized for 1.25 × max continuous' },
          { id: 'dq-vdrop', label: 'Voltage Drop', detail: '≤3% recommended (≤2% ideal)' },
          { id: 'dq-temp-derate', label: 'Temp Derating', detail: 'Applied for roof/ambient conditions' },
          { id: 'dq-conduit-fill', label: 'Conduit Fill', detail: '≤40% fill for 3+ conductors' },
        ]
      },
      {
        id: 'ocpd-sizing',
        title: '4.3 OCPD Sizing',
        items: [
          { id: 'dq-dc-ocpd-calc', label: 'DC OCPD', detail: '≥1.56 × Isc per string (if required)' },
          { id: 'dq-ac-breaker-calc', label: 'AC Breaker', detail: '≤ inverter max OCPD, ≥1.25 × Imax' },
          { id: 'dq-120-rule-calc', label: '120% Rule', detail: '(Main + PV) ≤ 1.2 × busbar rating' },
          { id: 'dq-supply-tap', label: 'Supply Side Tap', detail: 'Per 705.12(B)(2) if applicable' },
        ]
      },
      {
        id: 'grounding-calc',
        title: '4.4 Grounding',
        items: [
          { id: 'dq-egc-sizing', label: 'EGC Sizing', detail: 'Per NEC 250.122 or 690.45' },
          { id: 'dq-gec-sizing', label: 'GEC Sizing', detail: 'Per NEC 250.66 based on service size' },
          { id: 'dq-bonding', label: 'Bonding', detail: 'Modules, rails, inverter properly bonded' },
        ]
      }
    ]
  },
  {
    id: 'labels-rs',
    title: '5. Labels & Rapid Shutdown',
    subsections: [
      {
        id: 'rapid-shutdown-req',
        title: '5.1 Rapid Shutdown (NEC 690.12)',
        items: [
          { id: 'dq-initiation', label: 'Initiation Point', detail: 'Location of rapid shutdown initiator shown' },
          { id: 'dq-array-boundary', label: 'Array Boundary', detail: 'Controlled conductors within array boundary' },
          { id: 'dq-voltage-limits', label: 'Voltage Limits', detail: '≤80V within 30 sec, ≤30V within 30 sec (2017+)' },
          { id: 'dq-listed-equip', label: 'Listed Equipment', detail: 'PVRSS components listed to UL 1741' },
        ]
      },
      {
        id: 'labels',
        title: '5.2 Labeling Requirements',
        items: [
          { id: 'dq-main-label', label: 'Main Service Label', detail: 'DC voltage warning at service disconnect' },
          { id: 'dq-pv-disc-label', label: 'PV Disconnect Label', detail: 'Rated voltage/current, "PV SYSTEM DISCONNECT"' },
          { id: 'dq-inv-label', label: 'Inverter Label', detail: 'AC/DC ratings, emergency shutdown procedure' },
          { id: 'dq-conduit-labels', label: 'Conduit Labels', detail: '"PHOTOVOLTAIC POWER SOURCE" labels' },
          { id: 'dq-rs-label', label: 'Rapid Shutdown Label', detail: 'Per 690.56(C) at service entrance' },
          { id: 'dq-directory', label: 'Directory', detail: 'Circuit directory showing PV connection point' },
          { id: 'dq-gm-sign', label: 'Ground Mount Sign', detail: '"DANGER - HIGH VOLTAGE" if accessible' },
        ]
      }
    ]
  },
  {
    id: 'code-compliance',
    title: '6. Code Compliance',
    subsections: [
      {
        id: 'codes',
        title: '6.1 Applicable Codes',
        items: [
          { id: 'dq-nec-version', label: 'NEC Version', detail: '2017, 2020, 2023 - Article 690, 705, 706' },
          { id: 'dq-ibc-version', label: 'IBC/IRC Version', detail: 'Structural requirements' },
          { id: 'dq-ifc-version', label: 'IFC Version', detail: 'Fire setback and access requirements' },
          { id: 'dq-asce-version', label: 'ASCE 7 Version', detail: 'Wind/seismic/snow load design' },
          { id: 'dq-local-amend', label: 'Local Amendments', detail: 'Any AHJ-specific requirements noted' },
        ]
      },
      {
        id: 'listings',
        title: '6.2 Equipment Listings',
        items: [
          { id: 'dq-module-listing', label: 'Modules', detail: 'UL 61730 (or UL 1703) listed' },
          { id: 'dq-inv-listing', label: 'Inverters', detail: 'UL 1741 listed, IEEE 1547 compliant' },
          { id: 'dq-rs-listing', label: 'Rapid Shutdown', detail: 'UL 1741 listed PVRSS' },
          { id: 'dq-batt-listing', label: 'Batteries', detail: 'UL 9540 listed (if ESS)' },
          { id: 'dq-rack-listing', label: 'Racking', detail: 'UL 2703 listed' },
          { id: 'dq-disc-listing', label: 'Disconnects', detail: 'UL listed for DC application' },
        ]
      },
      {
        id: 'utility-req',
        title: '6.3 Utility Requirements',
        items: [
          { id: 'dq-interconnect-app', label: 'Interconnection App', detail: 'Utility application submitted/approved' },
          { id: 'dq-size-limit', label: 'System Size Limit', detail: 'Within utility program limits' },
          { id: 'dq-meter-req', label: 'Meter Requirements', detail: 'Net meter, production meter requirements' },
          { id: 'dq-ext-disc', label: 'External Disconnect', detail: 'Utility-accessible AC disconnect if required' },
          { id: 'dq-insurance', label: 'Insurance/Bonding', detail: 'Documentation if required by utility' },
        ]
      }
    ]
  },
  {
    id: 'documentation',
    title: '7. Documentation',
    subsections: [
      {
        id: 'spec-sheets',
        title: '7.1 Spec Sheets',
        items: [
          { id: 'dq-module-spec', label: 'Module Datasheet', detail: 'Current spec sheet matching model on plans' },
          { id: 'dq-inv-spec', label: 'Inverter Datasheet', detail: 'Current spec sheet with firmware version' },
          { id: 'dq-batt-spec', label: 'Battery Datasheet', detail: 'Spec sheet and installation manual (if ESS)' },
          { id: 'dq-rack-spec', label: 'Racking Cut Sheet', detail: 'Attachment details and engineering' },
          { id: 'dq-opt-spec', label: 'Optimizer Datasheet', detail: 'If using DC optimizers' },
        ]
      },
      {
        id: 'engineering',
        title: '7.2 Engineering',
        items: [
          { id: 'dq-struct-letter', label: 'Structural Letter', detail: 'PE stamped letter for roof attachment' },
          { id: 'dq-elec-calcs', label: 'Electrical Calcs', detail: 'PE stamped if required by AHJ' },
          { id: 'dq-wind-snow', label: 'Wind/Snow Calcs', detail: 'Design loads documented' },
        ]
      },
      {
        id: 'site-docs',
        title: '7.3 Site Documentation',
        items: [
          { id: 'dq-utility-bill', label: 'Utility Bill', detail: 'Recent bill showing meter # and service address' },
          { id: 'dq-site-photos', label: 'Site Photos', detail: 'Roof, MSP, meter, proposed equipment locations' },
          { id: 'dq-msp-photo', label: 'MSP Photo', detail: 'Clear photo of panel schedule and main breaker' },
          { id: 'dq-satellite', label: 'Satellite Image', detail: 'Current aerial for roof layout reference' },
        ]
      }
    ]
  },
  {
    id: 'final-review',
    title: '8. Final Review',
    subsections: [
      {
        id: 'drawing-quality',
        title: '8.1 Drawing Quality',
        items: [
          { id: 'dq-legibility', label: 'Legibility', detail: 'All text readable at scale, not overlapping' },
          { id: 'dq-consistency', label: 'Consistency', detail: 'Equipment names match across all sheets' },
          { id: 'dq-dimensions', label: 'Dimensions', detail: 'Critical dimensions shown and verified' },
          { id: 'dq-spelling', label: 'Spelling/Grammar', detail: 'No typos in labels or notes' },
          { id: 'dq-line-weights', label: 'Line Weights', detail: 'Clear hierarchy, proper symbols' },
        ]
      },
      {
        id: 'cross-reference',
        title: '8.2 Cross-Reference Check',
        items: [
          { id: 'dq-module-count', label: 'Module Count', detail: 'Site plan qty = single line qty = cover sheet qty' },
          { id: 'dq-inv-count', label: 'Inverter Count', detail: 'Consistent across all sheets' },
          { id: 'dq-system-size-check', label: 'System Size', detail: 'DC/AC watts match calculations and spec sheets' },
          { id: 'dq-wire-size-check', label: 'Wire Sizes', detail: 'Match between single line and three line' },
          { id: 'dq-breaker-check', label: 'Breaker Sizes', detail: 'Match single line and panel schedule' },
        ]
      },
      {
        id: 'ahj-specific',
        title: '8.3 AHJ-Specific Items',
        items: [
          { id: 'dq-special-req', label: 'Special Requirements', detail: 'Any AHJ-specific notes or details addressed' },
          { id: 'dq-redlines', label: 'Plan Check Comments', detail: 'Previous redline items corrected (if resubmit)' },
          { id: 'dq-permit-forms', label: 'Permit Forms', detail: 'Correct application forms completed' },
        ]
      }
    ]
  }
];

// Helper to count total items
export const getDesignChecklistTotal = () => {
  let count = 0;
  qcDesignChecklist.forEach(section => {
    section.subsections.forEach(sub => {
      count += sub.items.length;
    });
  });
  return count;
};

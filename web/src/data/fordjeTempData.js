// Temporary Fordje data for demo purposes
// Structure: AHJ data and Utility data separated

export const FORDJE_DEMO_DATA = {
  ahj: {
    name: 'Broomfield',
    state: 'CO',
    items: [
      { category: 'Code Cycle', name: 'Building Code Edition', value: '2021 International Building Code' },
      { category: 'Code Cycle', name: 'Electrical Code Edition', value: '2023 National Electrical Code' },
      { category: 'Code Cycle', name: 'Fire Code Edition', value: '2021 International Fire Code' },
      { category: 'Code Cycle', name: 'Residential Code Edition', value: '2021 International Residential Code' },
      { category: 'Contact', name: 'Building Department Address', value: '• One DesCombes Dr\n• Broomfield, CO 80020\n• 303.438.6370' },
      { category: 'Contact', name: 'Building Department Hours', value: '• Monday: 8AM - 5PM\n• Tuesday: 8AM - 5PM\n• Wednesday: 8AM - 5PM\n• Thursday: 8AM - 5PM\n• Friday: 8AM - 5PM' },
      { category: 'Contact', name: 'Building Official', value: '• Tim Pate\n• Chief Building Official\n• Email: tpate@broomfield.org\n• Phone: 303-438-6370' },
      { category: 'Contact', name: 'Planning Official', value: '• Lynn Merwin\n• Planning Director\n• Email: Planning@Broomfield.org\n• Phone: 303-438-6284' },
      { category: 'Design', name: 'Fire Access Pathways', value: 'Not fewer than two pathways, each at least 36 inches wide, on separate roof planes from lowest roof edge to ridge. At least one pathway on street/driveway side. 36" wide pathway required for each roof plane with PV array.' },
      { category: 'Engineering', name: 'Climate Zone', value: '5B' },
      { category: 'Engineering', name: 'Frost Depth', value: '36 inches' },
      { category: 'Engineering', name: 'Ground Snow Load', value: '30 PSF' },
      { category: 'Engineering', name: 'Wind Speed', value: '110 MPH' },
      { category: 'Permitting', name: 'PE Required', value: 'Structural Evaluation letter stamped by an Engineer showing correct design criteria.' },
      { category: 'Permitting', name: 'Structural Plan Requirements', value: '• Building section side views with framing members\n• Flush or tilt mounted indication\n• Roof covering type and layers\n• Sheathing type and thickness\n• Rafter size and spacing\n• Ridge board size\n• Collar ties size and spacing\n• Ceiling joist size and spacing\n• Double 2x top plates\n• All spans indicated' },
      { category: 'Permitting', name: 'Submittal Guidelines', value: 'General permit application, Electrician\'s Affidavit, Site plan (8.5x11, to scale), Structural roof framing info, 3-line electrical diagram, Mounting/racking details, Manufacturer spec sheets' },
      { category: 'Other', name: 'Roof Fire Classification', value: 'Class A' },
    ]
  },
  utility: {
    name: 'Xcel Energy',
    state: 'CO',
    items: [
      { category: 'Design', name: 'AC Disconnect Location', value: 'Adjacent to PV production meter within 10 feet of main service meter. Placards required if not within line of sight.' },
      { category: 'Design', name: 'AC Disconnect Required', value: 'Yes with conditions: Required for systems over 10 kW DC or supply-side connected; not required for ≤10 kW DC with breaker back feed.' },
      { category: 'Design', name: 'Production Meter Required', value: 'Conditional - only required for systems above 10 kW' },
      { category: 'Design', name: 'Production Meter Requirements', value: '• Production meter only required for systems above 10 kW\n• One production meter required for AC output measurement\n• No customer load on inverter side of production meter' },
      { category: 'Design', name: 'Supply Side Connections', value: 'Yes - Allowed' },
      { category: 'Design', name: 'Meter Collars Allowed', value: 'Yes with conditions: Must be approved, UL Listed, suitable for up to 200A, comply with safety requirements, customer approval/waiver required.' },
      { category: 'Hardware', name: 'Inverter Requirements', value: '• UL Standard: UL 1741\n• IEEE Standard: 1547-2018\n• Certifying Commission: California Energy Commission (CEC)' },
      { category: 'Hardware', name: 'Module Requirements', value: '• UL Standard: UL 1703\n• IEEE Standard: IEEE 1547\n• Certifying Commission: California Energy Commission (CEC)' },
      { category: 'Interconnection', name: 'Existing System Addition', value: 'PowerClerk: Indicate existing PV system, specify size in AC kW, include service voltage and inverter phase info. Drawings: Show existing systems on site plan and line diagram.' },
      { category: 'Interconnection', name: 'Line Diagram Guidelines', value: '• Customer name, address, city\n• Solar Panels: Number, make/model, DC and AC ratings\n• Inverter: Make, model, power rating, UL 1741 compliance\n• AC Disconnect: Lockable, visible open, labeled, within 10\' of meter\n• Production Meter: Amperage rating\n• Main Service Panel: Voltage, amperage, disconnect sizes\n• Utility Meter: Labeled "Photovoltaic System Connected"' },
      { category: 'Interconnection', name: 'Site Plan Guidelines', value: '• Customer name, address, city\n• Compass with North Arrow\n• Solar Panels: Visual depiction on roof\n• Electrical Equipment: Meter, panel, production meter, disconnect, inverter with distances\n• Accessibility: Fences, gates, access concerns' },
      { category: 'Permitting', name: 'Permit Cost', value: '$100' },
      { category: 'Permitting', name: 'PE Required', value: 'PE stamp required for energy modeling if system exceeds 200% historical kWh usage.' },
      { category: 'Sales', name: 'Max DC System Size', value: '200% of 12-month historical usage' },
    ]
  }
};

// Helper to group items by category
export const getItemsByCategory = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
};

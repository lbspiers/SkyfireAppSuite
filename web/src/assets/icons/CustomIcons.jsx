import React from 'react';

/**
 * Custom Skyfire Icons - Matching Lucide stroke style
 * 
 * Lucide conventions:
 * - viewBox: 0 0 24 24
 * - stroke-width: 2
 * - stroke-linecap: round
 * - stroke-linejoin: round
 * - fill: none
 */

// Roof icon for Structural tab
export const RoofIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Simple roof peak with chimney */}
    <path d="M3 11L12 4L21 11" />
    <path d="M17 7V4H19V9" />
  </svg>
);

// Site Plan - Rolled blueprint with grid/panels inside
export const SitePlanIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Rolled blueprint container */}
    <path d="M4 6C4 5 4.5 4 6 4H20V18C20 19 19.5 20 18 20H4V6Z" />
    <path d="M4 6C4 7.5 5 8 6 8H20" />
    <path d="M20 18C20 18 20 20 22 20" />
    {/* Grid inside representing panel layout */}
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="11" y1="8" x2="11" y2="17" />
    <line x1="14" y1="8" x2="14" y2="17" />
  </svg>
);

// Site Plan Alt - Rolled blueprint with house inside (matching your orange example)
export const SitePlanHouseIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Rolled blueprint container */}
    <path d="M4 6C4 5 4.5 4 6 4H20V18C20 19 19.5 20 18 20H4V6Z" />
    <path d="M4 6C4 7.5 5 8 6 8H20" />
    <path d="M20 18C20 18 20 20 22 20" />
    {/* House inside */}
    <path d="M8 16V12L12 9L16 12V16H8Z" />
    <path d="M11 16V14H13V16" />
  </svg>
);

// Plan Set - Rolled blueprint with checkmark inside
export const PlanSetIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Rolled blueprint - rolled on BOTH sides like your example */}
    <path d="M6 4C4.5 4 4 5 4 6V18C4 19 4.5 20 6 20" />
    <path d="M6 4H18C19.5 4 20 5 20 6V18C19.5 18 19 18.5 19 20H6" />
    <path d="M4 6C4 7 4.5 8 6 8" />
    <path d="M20 6C20 7 19.5 8 18 8H6" />
    {/* Checkmark inside */}
    <path d="M8 13L11 16L16 10" />
  </svg>
);

// Plan Set Alt - Simpler rolled document with check
export const PlanSetSimpleIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Scroll shape matching your plan_set2 image more closely */}
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M5 6C3 6 3 4 3 4C3 4 3 6 3 8V18C3 20 5 20 5 20" />
    <path d="M19 6C21 6 21 4 21 4C21 4 21 6 21 8V18C21 20 19 20 19 20" />
    {/* Checkmark */}
    <path d="M8 12L11 15L16 9" />
  </svg>
);

// Alternative roof - just the peak, cleaner
export const RoofSimpleIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Just the roof peak - matching your structural.png exactly */}
    <path d="M2 12L12 5L22 12" />
    <path d="M18 8V5H20V10" />
  </svg>
);


// ============================================
// DEMO COMPONENT - Render all icons for preview
// ============================================

const IconDemo = ({ icon: Icon, name, description }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    marginBottom: '8px'
  }}>
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }}>
      {/* Multiple sizes */}
      <div style={{ 
        width: '32px', 
        height: '32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000',
        borderRadius: '4px'
      }}>
        <Icon size={16} color="#9ca3af" />
      </div>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000',
        borderRadius: '4px'
      }}>
        <Icon size={20} color="#e5e7eb" />
      </div>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000',
        borderRadius: '4px'
      }}>
        <Icon size={24} color="#FD7332" />
      </div>
    </div>
    <div>
      <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{name}</div>
      <div style={{ color: '#6b7280', fontSize: '12px' }}>{description}</div>
    </div>
  </div>
);

export default function CustomIconsPreview() {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', marginBottom: '8px' }}>Custom Skyfire Icons</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
          Matching Lucide stroke style: strokeWidth=2, round caps/joins
        </p>

        <h3 style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px', textTransform: 'uppercase' }}>
          Structural Tab Options
        </h3>
        <IconDemo icon={RoofSimpleIcon} name="RoofSimpleIcon" description="Just the roof peak with chimney - clean & minimal" />
        <IconDemo icon={RoofIcon} name="RoofIcon" description="Roof peak variant" />

        <h3 style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px', marginTop: '24px', textTransform: 'uppercase' }}>
          Site Plan Tab Options
        </h3>
        <IconDemo icon={SitePlanIcon} name="SitePlanIcon" description="Blueprint with grid/panels inside" />
        <IconDemo icon={SitePlanHouseIcon} name="SitePlanHouseIcon" description="Blueprint with house inside (matches your orange example)" />

        <h3 style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px', marginTop: '24px', textTransform: 'uppercase' }}>
          Plan Set Tab Options
        </h3>
        <IconDemo icon={PlanSetIcon} name="PlanSetIcon" description="Blueprint with checkmark (rolled both sides)" />
        <IconDemo icon={PlanSetSimpleIcon} name="PlanSetSimpleIcon" description="Scroll document with checkmark" />

        {/* Side by side comparison */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#111',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>
            Recommended Pairing - Side by Side
          </h3>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#1e3a5f',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <SitePlanHouseIcon size={32} color="#60a5fa" />
              </div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>Site Plan</div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>House on blueprint</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#1f3d1a',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <PlanSetIcon size={32} color="#22c55e" />
              </div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>Plan Set</div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Check on blueprint</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <RoofSimpleIcon size={32} color="#9ca3af" />
              </div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>Structural</div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Roof peak</div>
            </div>
          </div>
        </div>

        {/* Usage code */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#000',
          borderRadius: '8px'
        }}>
          <h4 style={{ color: '#9ca3af', margin: '0 0 12px', fontSize: '12px' }}>Usage:</h4>
          <pre style={{ color: '#22c55e', fontSize: '11px', margin: 0, overflow: 'auto' }}>
{`import { 
  RoofSimpleIcon,      // Structural
  SitePlanHouseIcon,   // Site Plan  
  PlanSetIcon          // Plan Set
} from './CustomIcons';

// In your component:
<RoofSimpleIcon size={16} />
<SitePlanHouseIcon size={16} />
<PlanSetIcon size={16} />`}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * PreferredButton - Button to open preferred equipment modal
 *
 * Placed next to equipment section titles for quick access.
 * Uses ActionSectionButton (rectangular) with "Inventory" label.
 */

import ActionSectionButton from './ActionSectionButton';

const PreferredButton = ({ onClick, disabled = false }) => {
  return (
    <ActionSectionButton
      label="Inventory"
      variant="primary"
      onClick={onClick}
      disabled={disabled}
    />
  );
};

export default PreferredButton;

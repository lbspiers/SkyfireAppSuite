/**
 * PreferredButton - Button to open preferred equipment modal
 *
 * Placed next to equipment section titles for quick access.
 * Uses TableRowButton with "Inventory" label.
 */

import TableRowButton from './TableRowButton';

const PreferredButton = ({ onClick, disabled = false }) => {
  return (
    <TableRowButton
      label="Inventory"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
    />
  );
};

export default PreferredButton;

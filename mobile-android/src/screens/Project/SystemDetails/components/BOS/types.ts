// Shared types for BOS Chain components

export interface BOSItemData {
  isNew: boolean;
  equipmentType: string;
  ampRating: string;
  make: string;
  model: string;
  trigger: string | null;
}

export interface BOSChainItem {
  key: string;
  position: number;
  data: BOSItemData;
  setter: React.Dispatch<React.SetStateAction<BOSItemData>>;
  showState: boolean;
  label: string;
}

export interface ChainBOSProps {
  systemPrefix: string;
  systemNumber: number;
  projectID: string | null;
  utilityAbbrev?: string;
  maxContinuousOutputAmps: number | null;
  loadingMaxOutput: boolean;
}

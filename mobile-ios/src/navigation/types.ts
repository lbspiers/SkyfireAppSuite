// src/navigation/types.ts - UPDATED WITH PHOTO GALLERY ROUTE TYPES

export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  ChangePassword: undefined;
  OtpScreen: undefined;
  SuccessScreen: undefined;
  WelcomeScreen: undefined;
  CompanyAddress: undefined;
  UploadLogo: undefined;
  Inventory: undefined;
  AddInventory: undefined;
  InventoryCategory: undefined;
  serviceTerritory: undefined;
  TerritoryDetails: undefined;
  IntroScreens: undefined;
  Protected: undefined;
  Home: undefined;
  Main: undefined;
  Project: undefined;
  GeneratePage: undefined;
  EquipmentDetails_sys1: undefined;
  Submitted: undefined;
  Sandbox: undefined;
  Review: undefined;

  // NEW: Photo Gallery Route
  PhotoGallery: {
    projectId: string;
    initialSection?: string;
    fromScreen?: string;
    initialTag?: string;
  };

  // Load Calculations Route
  LoadCalculations: {
    panelType?: string;
    projectId?: string;
    companyId?: string;
    houseId?: number;
  };
};

export type TabParamList = {
  Site: undefined;
  Equipment: undefined;
  Electrical: undefined;
  Structural: undefined;
  Review: undefined;
  Camera: undefined;
};

// PhotoGallery specific types
export interface PhotoGalleryRouteParams {
  projectId: string;
  initialSection?: string;
  fromScreen?: string;
  initialTag?: string;
}

// Navigation helpers
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

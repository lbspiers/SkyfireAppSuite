export interface EnergySSFormValues {
  uuid?: string | null;
  backupType?: string;
  hasDaisyChain?: boolean;

  // Battery 1
  doesBatteryExists?: boolean;
  batteryQuantity?: number | null;
  batteryModelUuid?: string;
  batteryImages?: any[];

  // Battery 2
  doesBattery2Exists?: boolean;
  battery2Quantity?: number | null;
  battery2ModelUuid?: string;
  battery2Images?: any[];

  // ESS System
  essManagementSystem?: {
    mainBreakerRating?: number;
    upstreamBreakerRating?: number;
    upstreamBreakerLocation?: string;
    equipmentUuid?: string;
    equipmentImages?: any[];
    mainBreakerImages?: any[];
    upstreamBreakerImages?: any[];
    upstreamBreakerLocationImages?: any[];
  };
}

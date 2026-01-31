// C:\Release1.3.1\Front\skyfire_mobileapp_dev\src\components\Forms\siteform\SiteAddressSection.tsx

import React, { useEffect, useState } from "react";
import { View } from "react-native";
// ↙── two levels up into components, then into UI
import CollapsibleSection from "../../UI/CollapsibleSection";
import ThemedTextInput from "../../UI/ThemedTextInput";
import ThemedDropdown from "../../UI/ThemedDropdown";
// ↙── three levels up into src, then into utils/api
import { US_STATES } from "../../../utils/constants";
import { getZipCodesByState } from "../../../api/zip.service";
import { useSelector } from "react-redux";
import { DEBUG_MODE, writeDebugLog } from "../../../utils/debugTools";

interface SiteAddressSectionProps {
  values: {
    address: string;
    city: string;
    state: string;
    zip: string;
    apn?: string;
  };
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  handleChange: (field: string) => (value: any) => void;
  handleBlur: (field: string) => (e: any) => void;
  setFieldValue: (field: string, value: any) => void;
}

const SiteAddressSection: React.FC<SiteAddressSectionProps> = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
}) => {
  const token = useSelector((state: any) => state.auth.accessToken);
  const [zipOptions, setZipOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingZips, setLoadingZips] = useState(false);

  useEffect(() => {
    const fetchZips = async () => {
      if (!values.state || !token) return;

      const found = US_STATES.find(
        (s: { label: string; value: string }) =>
          s.value === values.state || s.label === values.state
      );
      const stateCode = found?.value;
      if (!stateCode) {
        DEBUG_MODE && writeDebugLog(`⚠️ Invalid state: ${values.state}`);
        return;
      }

      DEBUG_MODE && writeDebugLog(`📮 Fetching ZIPs for ${stateCode}`);
      setLoadingZips(true);
      const start = Date.now();

      try {
        const zips: string[] = await getZipCodesByState(stateCode, token);
        setZipOptions(zips.map((z) => ({ label: z, value: z })));

        DEBUG_MODE &&
          writeDebugLog(
            `📫 Loaded ${zips.length} ZIPs in ${Date.now() - start}ms`
          );
      } catch (err: any) {
        DEBUG_MODE && writeDebugLog(`⚠️ ZIP load failed: ${err}`);
        setZipOptions([]);
      } finally {
        setLoadingZips(false);
      }
    };

    fetchZips();
  }, [values.state, token]);

  return (
    <CollapsibleSection title="Project Site Address" initiallyExpanded>
      <ThemedTextInput
        label="Address*"
        value={values.address}
        onChangeText={handleChange("address")}
        onBlur={handleBlur("address")}
        errorText={
          touched.address && errors.address ? errors.address : undefined
        }
      />
      <ThemedTextInput
        label="City*"
        value={values.city}
        onChangeText={handleChange("city")}
        onBlur={handleBlur("city")}
        errorText={touched.city && errors.city ? errors.city : undefined}
      />
      <ThemedDropdown
        label="State*"
        data={US_STATES}
        value={values.state}
        onChangeValue={(stateCode: string) => {
          DEBUG_MODE && writeDebugLog(`🔽 State selected: ${stateCode}`);
          setFieldValue("state", stateCode);
          setFieldValue("zip", "");
        }}
        error={touched.state && errors.state ? errors.state : undefined}
      />
      <ThemedDropdown
        label="ZIP Code*"
        data={zipOptions}
        value={values.zip}
        onChangeValue={(zipCode: string) => setFieldValue("zip", zipCode)}
        error={touched.zip && errors.zip ? errors.zip : undefined}
        loading={loadingZips}
        disabled={!values.state || loadingZips}
      />
      <ThemedTextInput
        label="APN"
        value={values.apn || ""}
        onChangeText={handleChange("apn")}
        onBlur={handleBlur("apn")}
      />
    </CollapsibleSection>
  );
};

export default SiteAddressSection;

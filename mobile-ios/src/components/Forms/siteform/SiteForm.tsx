// C:\Release1.3.1\Front\skyfire_mobileapp_dev\src\components\Forms\siteform\SiteForm.tsx

import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import ThemedButton from "../../UI/ThemedButton";
import SiteAddressSection from "./SiteAddressSection";
import UtilitySection from "./UtilitySection";
import AdditionalQuestionsSection from "./AdditionalQuestionsSection";

import { SaveProjectSiteInfo } from "../../../api/project.service";
import { setProject } from "../../../store/slices/projectSlice";
import { useAutoSaveFormik } from "../../../hooks/useAutoSaveFormik";
import { usePrevious } from "../../../hooks/usePrevious";
import { DEBUG_MODE, writeDebugLog } from "../../../utils/debugTools";
import { fetchUtilitiesByZip } from "../../../api/utility.service";

const defaultInitialValues = {
  address: "",
  city: "",
  state: "",
  zip: "",
  apn: "",
  jurisdiction: "",
  utility: "",
  utilitySpecific: "",
  utilityMisc: "",
  jurisdictionQues: "",
  squareFootage: "",
  utilityFence: "",
};

const SiteForm: React.FC = () => {
  const formikRef = useRef<FormikProps<typeof defaultInitialValues>>(null);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  const projectInfo = useSelector((state: any) => state.project.currentProject);
  const companyId = useSelector((state: any) => state.profile.profile);
  const token = useSelector((state: any) => state.auth.accessToken);

  const [utilities, setUtilities] = useState<
    { label: string; value: string }[]
  >([]);
  const [utilityLoading, setUtilityLoading] = useState(false);
  const [lastFetchedZip, setLastFetchedZip] = useState("");
  const [isHydrating, setIsHydrating] = useState(false);
  const previousProjectId = usePrevious(projectInfo?.uuid);

  // --- validation schema ---
  const validationSchema = Yup.object().shape({
    address: Yup.string().required("Address is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    zip: Yup.string()
      .matches(/^\d{5}$/, "Zip code must be 5 digits")
      .required("Zip code is required"),
  });

  // --- auto‐save handler ---
  const handleSave = useCallback(
    async (values: typeof defaultInitialValues) => {
      const payload = {
        companyId: companyId?.company?.uuid,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zip,
        apn: values.apn,
        ahj: values.jurisdiction,
        utility: values.utility,
        jurisdictionQuestions: values.jurisdictionQues,
        utilityQuestions: values.utilitySpecific,
        miscQuestions: values.utilityMisc,
      };

      try {
        const response = await SaveProjectSiteInfo(projectInfo?.uuid, payload);
        if (response?.status === 200) {
          dispatch(setProject(response.data.project));
          DEBUG_MODE && writeDebugLog("✅ Site info auto-saved successfully.");
        } else {
          Toast.show({ text1: "Failed to save site info", type: "error" });
        }
      } catch (err) {
        console.error("❌ AutoSave Site Info Error:", err);
        Toast.show({ text1: "Auto-save error", type: "error" });
      }
    },
    [companyId, dispatch, projectInfo?.uuid]
  );

  useAutoSaveFormik(formikRef, handleSave, 800, isHydrating);

  // --- fetch utilities when ZIP changes ---
  useEffect(() => {
    const currentZip = formikRef.current?.values.zip;
    if (!currentZip || currentZip.length !== 5 || !token) return;
    if (currentZip === lastFetchedZip) return;

    setLastFetchedZip(currentZip);
    setUtilityLoading(true);
    DEBUG_MODE && writeDebugLog(`📡 Fetching utilities for ZIP: ${currentZip}`);
    const start = Date.now();

    fetchUtilitiesByZip(currentZip, token)
      .then((raw) => {
        const formatted = raw.map((u: string) => ({ label: u, value: u }));
        setUtilities(formatted);

        if (formatted.length === 1) {
          formikRef.current?.setFieldValue("utility", formatted[0].value);
          DEBUG_MODE &&
            writeDebugLog(`🎯 Auto-selected utility: ${formatted[0].value}`);
        }
        DEBUG_MODE &&
          writeDebugLog(
            `📦 ${formatted.length} utilities loaded in ${Date.now() - start}ms`
          );
      })
      .catch((err) => {
        setUtilities([]);
        DEBUG_MODE && writeDebugLog(`🚫 Utility fetch failed: ${err.message}`);
      })
      .finally(() => setUtilityLoading(false));
  }, [formikRef.current?.values.zip, lastFetchedZip, token]);

  // --- rehydrate form from project on mount/change ---
  useEffect(() => {
    if (projectInfo?.uuid && projectInfo.uuid !== previousProjectId) {
      setIsHydrating(true);
      const start = Date.now();

      formikRef.current?.resetForm({
        values: {
          address: projectInfo.site.address || "",
          city: projectInfo.site.city || "",
          state: projectInfo.site.state || "",
          zip: projectInfo.site.zip_code || "",
          apn: projectInfo.site.apn || "",
          jurisdiction: projectInfo.site.ahj || "",
          utility: projectInfo.site.utility || "",
          utilitySpecific: projectInfo.site.utility_questions || "",
          utilityMisc: projectInfo.site.misc_questions || "",
          jurisdictionQues: projectInfo.site.jurisdiction_questions || "",
          squareFootage: "",
          utilityFence: "",
        },
      });

      const end = Date.now();
      setTimeout(() => setIsHydrating(false), 250);
      DEBUG_MODE && writeDebugLog(`🔄 SiteForm hydrated in ${end - start}ms`);
    }
  }, [projectInfo?.uuid, previousProjectId]);

  return (
    <View style={{ flex: 1 }}>
      <Formik
        innerRef={formikRef}
        initialValues={defaultInitialValues}
        validationSchema={validationSchema}
        onSubmit={() => {}}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <View style={{ flex: 1, paddingBottom: 100 }}>
            <SiteAddressSection
              values={values}
              errors={errors}
              touched={touched}
              handleChange={(field) => (v) => setFieldValue(field, v)}
              handleBlur={() => () => formikRef.current?.setFieldTouched}
              setFieldValue={setFieldValue}
            />

            <UtilitySection
              values={values}
              errors={errors}
              touched={touched}
              setFieldValue={setFieldValue}
              utilities={utilities}
              utilityLoading={utilityLoading}
              onAutoSave={async () => {
                if (formikRef.current?.dirty) {
                  await handleSave(formikRef.current.values);
                }
              }}
            />

            <AdditionalQuestionsSection
              values={values}
              errors={errors}
              touched={touched}
              setFieldValue={setFieldValue}
            />

            <View style={styles.nextButtonContainer}>
              <ThemedButton
                onPress={() => navigation.navigate("EquipmentScreens")}
                color1="#FD7332" // top of gradient
                color2="#B92011" // bottom of gradient
                small
                gradient
              >
                Next ➡️
              </ThemedButton>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  nextButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 16,
    paddingRight: 16,
  },
});

export default SiteForm;

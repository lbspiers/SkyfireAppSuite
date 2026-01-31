// src/screens/Project/SiteInfo.tsx

import React from "react";
import { View, SafeAreaView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import * as Yup from "yup";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";

import Header from "../../components/Header";
import TextInputField from "../../components/TextInput";
import Button from "../../components/Button";
import { SaveProjectSiteInfo } from "../../api/project.service";
import { projectSiteInfo } from "../../store/slices/projectSlice";
import { styles } from "../../styles/siteStyle";

const SiteInfo = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const companyProfile = useSelector((s: any) => s.profile.profile);

  const {
    firstName,
    lastName,
    street,
    city,
    state,
    zip,
    projectId,
    projectUuid,
  } = route.params;

  const initialValues = {
    address: street,
    city,
    state,
    zip,
    apn: "",
    jurisdiction: "",
    utility: "",
  };

  const validationSchema = Yup.object().shape({
    address: Yup.string().required("Address is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    zip: Yup.string().required("Zip is required"),
  });

  const handleSubmit = async (values: any) => {
    const payload = {
      companyId: companyProfile?.company?.uuid, // Use user's company for authorization
      address: values.address,
      city: values.city,
      state: values.state,
      zipCode: values.zip,
      apn: values.apn,
      ahj: values.jurisdiction,
      utility: values.utility,
    };

    try {
      const resp = await SaveProjectSiteInfo(projectUuid, payload);
      if (resp.status === 200) {
        dispatch(projectSiteInfo(resp.data.project));
        Toast.show({ 
          text1: "Data Saved", 
          type: "success",
          position: "top",
          visibilityTime: 1500, // Quick toast
        });
        navigation.navigate("EquipmentScreens");
      } else {
        Toast.show({ text1: "Update failed", type: "error" });
      }
    } catch {
      Toast.show({ text1: "Network error", type: "error" });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header
        back
        onBackPress={() => navigation.goBack()}
        lines={[
          "Site Info",
          `${lastName}, ${firstName}`,
          street,
          `${city}, ${state} ${zip}`,
          projectId,
        ]}
      />

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={{ flex: 1, padding: 16, paddingTop: 100 }}>
            <TextInputField
              label="Address"
              onChangeText={handleChange("address")}
              onBlur={handleBlur("address")}
              value={values.address}
              error={touched.address && errors.address}
            />
            <TextInputField
              label="City"
              onChangeText={handleChange("city")}
              onBlur={handleBlur("city")}
              value={values.city}
              error={touched.city && errors.city}
            />
            <TextInputField
              label="State"
              onChangeText={handleChange("state")}
              onBlur={handleBlur("state")}
              value={values.state}
              error={touched.state && errors.state}
            />
            <TextInputField
              label="Zip"
              onChangeText={handleChange("zip")}
              onBlur={handleBlur("zip")}
              value={values.zip}
              error={touched.zip && errors.zip}
            />
            <TextInputField
              label="APN"
              onChangeText={handleChange("apn")}
              onBlur={handleBlur("apn")}
              value={values.apn}
            />
            <TextInputField
              label="Jurisdiction"
              onChangeText={handleChange("jurisdiction")}
              onBlur={handleBlur("jurisdiction")}
              value={values.jurisdiction}
            />
            <TextInputField
              label="Utility"
              onChangeText={handleChange("utility")}
              onBlur={handleBlur("utility")}
              value={values.utility}
            />

            <View style={{ marginTop: 24 }}>
              <Button
                color1="#FD7332"
                color2="#EF3826"
                children="Submit"
                onPress={() => handleSubmit()}
              />
            </View>
          </View>
        )}
      </Formik>
    </SafeAreaView>
  );
};

export default SiteInfo;

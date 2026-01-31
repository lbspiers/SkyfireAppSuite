import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { CreateNewProject } from "../../api/project.service";
import { setProject } from "../../store/slices/projectSlice";
import AppHeader from "../../components/Header/AppHeader";
import TextInputField from "../../components/TextInput";
import ThemedButton from "../../components/UI/ThemedButton";
import CollapsibleSection from "../../components/UI/CollapsibleSection";

const NewProject: React.FC = () => {
  const formikRef = useRef<FormikProps<any>>(null);
  const dispatch = useDispatch();
  const navigation: any = useNavigation();
  const companyProfile = useSelector((s: any) => s.profile.profile);
  const [loading, setLoading] = useState(false);

  const initialValues = {
    installer: companyProfile?.company?.name || "",
    projectID: `${Math.floor(Date.now() / 1000)}`,
    firstName: "",
    lastName: "",
  };

  useFocusEffect(
    React.useCallback(() => {
      formikRef.current?.resetForm();
    }, [])
  );

  const schema = Yup.object().shape({
    installer: Yup.string().required("Installer is required"),
    projectID: Yup.string().required("Project ID is required"),
    firstName: Yup.string().required("Customer First Name is required"),
    lastName: Yup.string().required("Customer Last Name is required"),
  });

  const handleCreate = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      const resp = await CreateNewProject({
        company_id: companyProfile.company.uuid,
        installer_name: values.installer,
        installer_project_id: values.projectID,
        customer_first_name: values.firstName,
        customer_last_name: values.lastName,
      });
      if (resp.status === 200 && resp.data.project) {
        Toast.show({ text1: "Project Added Successfully", type: "success" });
        dispatch(setProject(resp.data.project));
        setTimeout(() => navigation.navigate("Main"), 1000);
      } else {
        Toast.show({ text1: "Failed to create project", type: "error" });
      }
    } catch (error: any) {
      console.error("Create Project Error:", error.message);
      Toast.show({ text1: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        extraScrollHeight={20}
        enableOnAndroid
        contentContainerStyle={styles.container}
      >
        <AppHeader title="New Project" />

        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleCreate}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View>
              <CollapsibleSection title="Project Setup" initiallyExpanded>
                <TextInputField
                  label="Installer*"
                  placeholder="Installer"
                  value={values.installer}
                  onChangeText={handleChange("installer")}
                  onBlur={handleBlur("installer")}
                  widthPercent={100}
                  errorText={touched.installer ? errors.installer : undefined}
                />

                <TextInputField
                  label="Installer Project ID*"
                  placeholder="Project ID"
                  value={values.projectID}
                  onChangeText={handleChange("projectID")}
                  onBlur={handleBlur("projectID")}
                  widthPercent={100}
                  errorText={touched.projectID ? errors.projectID : undefined}
                />

                <TextInputField
                  label="Customer First Name*"
                  placeholder="First Name"
                  value={values.firstName}
                  onChangeText={handleChange("firstName")}
                  onBlur={handleBlur("firstName")}
                  widthPercent={100}
                  errorText={touched.firstName ? errors.firstName : undefined}
                />

                <TextInputField
                  label="Customer Last Name*"
                  placeholder="Last Name"
                  value={values.lastName}
                  onChangeText={handleChange("lastName")}
                  onBlur={handleBlur("lastName")}
                  widthPercent={100}
                  errorText={touched.lastName ? errors.lastName : undefined}
                />
              </CollapsibleSection>

              <View style={styles.buttonWrapper}>
                <ThemedButton
                  onPress={handleSubmit}
                  color1="#FD7332"
                  color2="#EF3826"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    "Create Project"
                  )}
                </ThemedButton>
              </View>
            </View>
          )}
        </Formik>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default NewProject;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E2128",
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  buttonWrapper: {
    marginTop: 30,
  },
});

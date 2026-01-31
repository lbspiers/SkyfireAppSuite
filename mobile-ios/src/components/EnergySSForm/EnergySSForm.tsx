import React from "react";
import { View } from "react-native";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";

import BackupTypeSelector from "./BackupTypeSelector";
import IntegratedESSCheckbox from "./IntegratedESSCheckbox";
import EssManagementSystemSection from "./EssManagementSystemSection";
import BatterySection from "./BatterySection";
import SecondaryBatterySection from "./SecondaryBatterySection";
import FooterActionSection from "./FooterActionSection";
import { EnergySSFormValues } from "./types";
import { styles } from "../../styles/energySSStyles";

interface Props {
  formikRef: React.RefObject<FormikProps<any>>;
  initialValues: EnergySSFormValues;
  onSubmit: (values: EnergySSFormValues) => void;
  errorMessage: string;
  systemType: string;
  selectedOption: string;
  checkbox: boolean;
  setCheckbox: (v: boolean) => void;
  isSecondBattery: boolean;
  setSecondBattery: (v: boolean) => void;
  isBackupLoad: boolean;
  setBackupLoad: (v: boolean) => void;
  handleSetActive: (v: string) => void;
  active: string;
  currentData: any;
  handleBlurWithSave: (handler: any, field: string) => () => void;
}

const validationSchema = Yup.object().shape({
  batteryQuantity: Yup.number().nullable(),
  battery2Quantity: Yup.number().nullable(),
  batteryModelUuid: Yup.string().nullable(),
  battery2ModelUuid: Yup.string().nullable(),
});

const EnergySSForm: React.FC<Props> = ({
  formikRef,
  initialValues,
  onSubmit,
  errorMessage,
  systemType,
  selectedOption,
  checkbox,
  setCheckbox,
  isSecondBattery,
  setSecondBattery,
  isBackupLoad,
  setBackupLoad,
  handleSetActive,
  active,
  currentData,
  handleBlurWithSave,
}) => {
  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({ handleBlur, setFieldValue, values, errors, touched }) => (
        <View style={{ paddingBottom: 100 }}>
          {selectedOption !== "No Backup" && (
            <EssManagementSystemSection
              styles={styles}
              values={values}
              systemType={systemType}
              setFieldValue={setFieldValue}
              handleBlur={handleBlur}
              handleBlurWithSave={handleBlurWithSave}
              touched={touched}
              errors={errors}
            />
          )}
          <BatterySection
            styles={styles}
            values={values}
            errors={errors}
            touched={touched}
            handleBlur={handleBlur}
            handleBlurWithSave={handleBlurWithSave}
            setFieldValue={setFieldValue}
            equipmentUuid={values.batteryModelUuid ?? ""}
            manufacturer={currentData?.batteryEquipment?.manufacturer ?? ""}
            fieldIndex={0}
          />
          <SecondaryBatterySection
            styles={styles}
            isSecondBattery={isSecondBattery}
            setSecondBattery={setSecondBattery}
            values={values}
            errors={errors}
            touched={touched}
            handleBlur={handleBlur}
            handleBlurWithSave={handleBlurWithSave}
            setFieldValue={setFieldValue}
            equipmentUuid={values.battery2ModelUuid ?? ""}
            manufacturer={currentData?.battery2Equipment?.manufacturer ?? ""}
          />
          <FooterActionSection
            active={active}
            handleSetActive={handleSetActive}
            isBackupLoad={isBackupLoad}
            setBackupLoad={setBackupLoad}
          />
        </View>
      )}
    </Formik>
  );
};

export default EnergySSForm;

import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import Modal from "react-native-modal";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../../utils/styleConstant/Color";
import Text from "../../../components/Text";
import Button from "../../Button";
import fontFamily from "../../../utils/styleConstant/FontFamily";
import TextInputField from "../../TextInput";
import { Formik, FormikProps } from "formik";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Colors } from "react-native/Libraries/NewAppScreen";
import DropdownComponent from "../../../components/Dropdown";
import {
  AddToInventory,
  AddUnListedInventory,
  GetModelNumber,
} from "../../../api/inventry.service";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import * as Yup from "yup";

const InputModal = ({
  title,
  closeModal = () => {},
  bottonText,
  onPressButton = () => {},
  data,
}: any) => {
  const formikRef = React.useRef<FormikProps<any>>(null);
  const [manufacturer, setManufacturer] = React.useState("");
  const [modalNumber, setModalnumber] = React.useState([]);
  const [notListed, setNotListed] = React.useState(false);
  const [modelNumberValue, setModalnumberValue] = React.useState("");
  const companyId = useSelector((store: any) => store?.profile?.profile);
  const [loading, setLoading] = React.useState(false);
  const navigation: any = useNavigation();
  const [error, setErrorMessage] = React.useState({
    manufacturer: "",
    modelNumber: "",
  });

  const initialValues: any = {
    Manufacturer: "",
    modelNumber: "",
  };
  const fetchModelNumber = async (type: any, manufacturer: any) => {
    try {
      const response: any = await GetModelNumber(type, manufacturer);
      if (response?.status == 200) {
        setModalnumber(response?.data?.data);
      } else {
        console.log(response?.data, "modeleee");
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };
  React.useEffect(() => {
    fetchModelNumber(title, manufacturer);
  }, [manufacturer]);

  const validationForDropdown = () => {
    let isValid = true; // Start with the assumption that the form is valid
    let errors: any = {}; // Object to hold error messages

    // Validate manufacturer
    if (!manufacturer || manufacturer.trim() === "") {
      errors.manufacturer = "Manufacturer is required";
      isValid = false; // Mark the form as invalid
    }

    // Validate model number
    if (!modelNumberValue || modelNumberValue.trim() === "") {
      errors.modelNumber = "Model Number is required";
      isValid = false; // Mark the form as invalid
    }

    // Set the error messages
    setErrorMessage(errors);

    // Return the validity status
    return isValid;
  };
  const validationNotListed = (values: any) => {
    let isValid = true; // Start with the assumption that the form is valid
    let errors: any = {}; // Object to hold error messages
    if (values.Manufacturer.trim() == "") {
      errors.manufacturer = "Manufacturer is required";
      isValid = false;
    }
    if (values.modelNumber.trim() == "") {
      errors.modelNumber = "Model Number is required";
      isValid = false;
    }
    setErrorMessage(errors);
    return isValid;
  };

  const handleEquipmentData = async (data: any) => {
    setLoading(true);
    try {
      const response = await AddToInventory(companyId?.company?.uuid, {
        equipmentUuid: data,
      });

      if (response?.status === 200) {
        Toast.show({
          text1: "Equipment Added Successfully",
          type: "success",
          position: "top",
          visibilityTime: 2000,
        });
        closeModal();
        // navigation.navigate("Inventory");
      } else {
        console.error("Failed to add equipment:", response?.data);
      }
    } catch (error: any) {
      console.error("Error occurred:", error?.message);
    } finally {
      setLoading(false);
    }
  };
  const handleNotListedInventorey = async (data: any) => {
    setLoading(true);
    try {
      const response = await AddUnListedInventory(
        companyId?.company?.uuid,
        data
      );

      if (response?.status === 200) {
        Toast.show({
          text1: "UnListed Equipment Added Successfully",
          type: "success",
          position: "top",
          visibilityTime: 2000,
        });
        closeModal();
      } else if (response) {
        console.error("Error:", response.data);
      } else {
        console.error("Error: No response from server");
      }
    } catch (error: any) {
      console.error("Error occurred:", error?.message);
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object({
    Manufacturer: Yup.string().required("Manufacturer is required"),

    modelNumber: Yup.string().required("Model number is required"),
  });

  console.log(error);
  const handleForm = () => {
    // alert();
  };
  return (
    <Modal isVisible={true} style={styles.main}>
      <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.container}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          // enableAutomaticScroll
          // extraScrollHeight={20}
        >
          <View style={styles.titleMainView}>
            {notListed ? (
              <View style={styles.titleTextView}>
                <Text
                  children={"Type in equipment"}
                  style={{
                    textAlign: "center",
                    color: COLORS.white,
                    fontFamily: fontFamily.Inter_28pt_Regular,
                    fontSize: 24,
                  }}
                />
              </View>
            ) : (
              <View style={styles.titleTextView}>
                {title && (
                  <Text
                    children={title}
                    style={{
                      textAlign: "center",
                      color: COLORS.white,
                      fontFamily: fontFamily.Inter_28pt_Regular,
                      fontSize: 24,
                    }}
                  />
                )}
              </View>
            )}
            <TouchableOpacity
              onPress={() => closeModal(false)}
              style={styles.closeView}
            >
              <Image
                source={require("./../../../assets/Images/icons/close.png")}
                style={{ height: 30, width: 30, tintColor: COLORS.white }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.mainFormView}>
            <Formik
              innerRef={formikRef}
              initialValues={initialValues}
              validationSchema={validationSchema} // Add validation schema here
              onSubmit={(values: any) => {
                handleForm;
              }}
              validateOnChange={false}
              validateOnBlur={false}
              setFieldValue
            >
              {({ handleChange, handleBlur, values, errors }) => (
                <>
                  <View style={styles.textInputView}>
                    <View
                      style={{
                        flex: 0.6,
                      }}
                    >
                      {notListed ? (
                        <>
                          <TextInputField
                            label={"Manufacturer"}
                            onChangeText={handleChange("Manufacturer")}
                            onBlur={handleBlur("Manufacturer")}
                            value={values.Manufacturer}
                            labelStyle={{
                              fontFamily: fontFamily.lato,
                              fontSize: 14,
                              color: COLORS.white,
                              fontWeight: "400",
                              paddingTop: 10,
                              opacity: 0.5,
                            }}
                            activeUnderlineColor={"#ECECF233"}
                            error={error.manufacturer}
                          />
                          <TextInputField
                            label={"Model number"}
                            onChangeText={handleChange("modelNumber")}
                            onBlur={handleBlur("modelNumber")}
                            value={values.modelNumber}
                            labelStyle={{
                              fontFamily: fontFamily.lato,
                              fontSize: 14,
                              color: COLORS.white,
                              fontWeight: "400",
                              paddingTop: 10,
                              opacity: 0.5,
                            }}
                            activeUnderlineColor={"#ECECF233"}
                            error={error.modelNumber}
                          />
                        </>
                      ) : (
                        <View style={{}}>
                          <View style={{ marginVertical: 30 }}>
                            <DropdownComponent
                              label={"Manufacturer"}
                              onChangeValue={(value: string) => {
                                // setFieldValue("state", value);
                                setManufacturer(value);
                              }}
                              value={values.manufacturer}
                              error={error.manufacturer}
                              type={title}
                              data={data.map((item: any) => ({
                                label: item,
                                value: item,
                              }))}
                            />
                          </View>
                          <DropdownComponent
                            label={"Model Number"}
                            onChangeValue={(value: string) => {
                              setModalnumberValue(value);
                            }}
                            type={title}
                            value={values.modalNumber}
                            error={error.modelNumber}
                            data={modalNumber}
                            labelField={"model"}
                            valueField={"uuid"}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.buttonView}>
                    <Button
                      color1={"#FD7332"}
                      color2={"#EF3826"}
                      children={
                        loading ? (
                          <ActivityIndicator color={"#ffff"} />
                        ) : (
                          "+ Add"
                        )
                      }
                      style={styles.buttonStyle}
                      onPress={() =>
                        notListed
                          ? validationNotListed(values) &&
                            handleNotListedInventorey({
                              equipmentType: title,
                              manufacturer: values?.Manufacturer,
                              modelName: values?.modelNumber,
                            })
                          : validationForDropdown() &&
                            handleEquipmentData(modelNumberValue)
                      }
                      labelStyle={{
                        fontFamily: fontFamily.lato,
                        fontSize: 14,
                        color: COLORS.white,
                        fontWeight: "700",
                      }}
                    />
                  </View>
                </>
              )}
            </Formik>
          </View>

          {bottonText && notListed === false && (
            <TouchableOpacity
              style={{
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 50,
              }}
              onPress={() => setNotListed(true)}
            >
              <Text
                children={bottonText}
                style={{ fontWeight: "700", color: COLORS.white }}
              />
            </TouchableOpacity>
          )}
        </KeyboardAwareScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1, alignItems: "center", paddingVertical: 10 },
  container: {
    height: "auto",
    width: "100%",
    borderRadius: 9,
  },
  titleMainView: { flexDirection: "row", paddingVertical: 10 },
  titleTextView: {
    height: "auto",
    flexDirection: "row",
    paddingVertical: 20,
    alignItems: "center",
    flex: 0.9,
    justifyContent: "center",
  },
  closeView: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 3,
  },
  mainFormView: { height: "50%", paddingHorizontal: 20 },
  textInputView: { height: "100%", justifyContent: "center" },
  buttonView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 20,
  },
  buttonStyle: {
    height: "80%",
    width: "58%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
});
export default InputModal;

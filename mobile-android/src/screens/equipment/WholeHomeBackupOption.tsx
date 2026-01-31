import React, { useEffect, useRef, useState } from "react";
import { Image, SafeAreaView, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/wholehomebackupstyles";
import Text from "../../components/Text/index";
import Button from "../../components/Button";
import DropdownComponent from "../../components/Dropdown";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CameraOption } from "../Project/CameraOption";
import logger from "../../utils/logger";
import { ampsRatings, omitNullValues, loadType } from "../../utils/utlityFunc";
import EquipmentPicker from "../../components/Project/EquipmentPicker";
import { useSelector } from "react-redux";
import { saveEnergySystemDetails } from "../../api/project.service";
import { debounce } from "lodash";
import TextInputField from "../../components/TextInput";

const WholeHomeBackupOption = (props: any) => {
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<string | any>>();
  const company = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector((store: any) => store?.project?.currentProject?.uuid);
  const companyID = company?.company?.uuid;
  const { title, systemType, equipmentSetUuid, flag, essUuid, currentData }: any = params;
  const [formData, setFormData] = useState({
    panelType: "MainPanel",
    isExisting: true,
    busBarRating: "",
    mainBreakerRating: "",
    upstreamBreakerRating: "",
    equipmentUuid: "",
    backupLoadData: Array(10).fill({
      loadType: "",
      loadCapacity: "",
    }),
  });
  const [images, setImages] = useState({
    ESSMake: [],
  });
  const handleInputChange = (name: any, value: any) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };
  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({
      ...prevImages,
      [type]: selectedImages,
    }));
  };

  // Function to handle dynamic changes in backupLoadData
  const handleLoadInputChange = (index: number, field: string, value: string) => {
    setFormData((prevState) => {
      const updatedLoadData = [...prevState.backupLoadData];
      updatedLoadData[index] = {
        ...updatedLoadData[index],
        [field]: value,
      };
      return { ...prevState, backupLoadData: updatedLoadData };
    });
  };

  const [isWholeBackup, setIsWholeBackup] = useState<boolean>(true);
  const options = ["+ New Panel", "(E) Main Panel", "(E) Sub Panel"];
  const [selectedOption, setSelection] = useState<string>("+ New Panel");

  const handleInfo = () => {};

  const handleSelection = (value: string) => {
    setSelection(value);
    if (value === "(E) Main Panel") {
      handleInputChange("panelType", "MainPanel");
      //navigation.navigate("Equipment");
    } else if (value === "(E) Sub Panel") {
      handleInputChange("panelType", "SubPanel");
    } else {
      handleInputChange("panelType", "NewPanel");
    }
  };

  const CheckBox: React.FC<any> = ({ label, onCheckChange, isChecked }) => {
    const [checked, setChecked] = useState(isChecked);

    useEffect(() => {
      setChecked(isChecked);
    }, [isChecked]);

    useEffect(() => {
      if (props?.route?.params?.flag === "partialHome") {
        setIsWholeBackup(false);
      }
    }, []);

    const handlePress = () => {
      const newChecked = !checked;
      setChecked(newChecked);
      onCheckChange(newChecked);
    };
    console.log("Navigation124", props?.route?.params?.flag);
    return (
      <View style={styles.keepView}>
        <TouchableOpacity onPress={handlePress}>
          <Image
            style={{ height: 24, width: 24 }}
            source={
              checked
                ? require("../../assets/Images/icons/checked.png")
                : require("../../assets/Images/icons/checkbox.png")
            }
          />
        </TouchableOpacity>
        <Text children={label} style={styles.keepMeLogText} />
      </View>
    );
  };
  async function saveFormData() {
    setLoading(true);
    const payload = {
      uuid: essUuid,
      equipmentSetUuid,
      backupLoadSubpanel: {
        ...formData,
        equipmentImages: images,
      },
    };
    try {
      const response = await saveEnergySystemDetails(projectID, companyID, omitNullValues(payload));
      if (response?.status == 200) {
        console.log("response", response?.data);
      } else {
        console.log("Failed to save equipment details", JSON.stringify(response?.data?.error));
      }
    } catch (error: any) {
      console.log(error?.message);
    } finally {
      setLoading(false);
    }
  }

  const debouncedSave: any = debounce(saveFormData, 1000);

  useEffect(() => {
    if (!isFirstRender.current) {
      debouncedSave();
    } else {
      isFirstRender.current = false;
    }
  }, [formData]);

  useEffect(() => {
    if (currentData) {
      // Merge currentData.backupLoadData with the default 10 items
      const backupLoadData = (currentData?.backupLoadSubpanel?.backupLoadData || []).map(
        (item: any) => ({
          loadType: item?.loadType || "",
          loadCapacity: item?.loadCapacity || "",
        })
      );

      // Fill the remaining spots with empty data if needed
      const filledBackupLoadData = [
        ...backupLoadData,
        ...Array(10 - backupLoadData.length).fill({
          loadType: "",
          loadCapacity: "",
        }),
      ];
      // Update form data
      setFormData({
        panelType: currentData?.backupLoadSubpanel?.panelType || "MainPanel",
        isExisting: currentData?.backupLoadSubpanel?.isExisting,
        busBarRating: currentData?.backupLoadSubpanel?.busBarRating || "",
        mainBreakerRating: currentData?.backupLoadSubpanel?.mainBreakerRating || "",
        upstreamBreakerRating: currentData?.backupLoadSubpanel?.upstreamBreakerRating || "",
        equipmentUuid: currentData?.backupLoadSubpanel?.equipment?.uuid || "",
        backupLoadData: filledBackupLoadData,
      });
    }
    if (!!currentData?.backupLoadSubpanel?.equipmentImages) {
      setImages(currentData?.backupLoadSubpanel?.equipmentImages);
    }
    let panelType = currentData?.backupLoadSubpanel?.panelType;
    if (panelType == "MainPanel") {
      panelType = "(E) Main Panel";
    } else if (panelType == "SubPanel") {
      panelType = "(E) Sub Panel";
    } else {
      panelType = "+ New Panel";
    }
    handleSelection(panelType);
  }, [currentData]);
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1, margin: 25 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          enableOnAndroid
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* <HeaderLogoComponent
            isTitle={true}
            title="MicroInverter 1 Stringing"
            back={false}
            applogo={true}
            onIconPress={() => console.log("Icon Pressed")}
            
          /> */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              children={"Microinverter 1 ESS Backup Load Sub Panel"}
              style={styles.headerTitle}
            />
            <TouchableOpacity onPress={() => console.log("")}>
              <Image
                source={require("../../assets/Images/fire-inactive.png")}
                style={styles.logoStyle}
              />
            </TouchableOpacity>
          </View>
          <View>
            <Text children={"Doe, John"} style={styles.username}></Text>
            <View>
              <Text style={styles.Address} children={"1234 W Covered Wagon Way"}></Text>
              <Text style={styles.Address} children={"Western City, ST 12345"}></Text>
            </View>
            <View style={styles.btn_Installer}>
              <Text style={styles.installer} children={"Installer ID123"}></Text>
              <Button
                color1={"#0C1F3F"}
                color2={"#213454"}
                color3={"#2E4161"}
                children={"< Back"}
                style={styles.btnStyle}
                labelStyle={styles.buttonText}
                onPress={() => navigation.goBack()}
              />
            </View>
            {/* {isWholeBackup && (
              <View>
                <CheckBox
                  label="Use Main Panel A"
                  onCheckChange={() => {}}
                  isChecked={false} // pass the current state
                />
                <CheckBox
                  label="Use Sub Panel B"
                  onCheckChange={() => {}}
                  isChecked={false} // pass the current state
                />
              </View>
            )} */}
            <Text
              children={"Select Backup Load Sub Panel"}
              style={[styles.backupTitle, { paddingTop: 10 }]}
            />
            <View style={styles.optionsContainer}>
              {options.map((value, index) => {
                return (
                  <View style={styles.option}>
                    <TouchableOpacity onPress={() => handleInfo()}>
                      <Image
                        source={require("../../assets/Images/icons/info.png")}
                        style={{ width: 25, height: 25, alignSelf: "center" }}
                      />
                    </TouchableOpacity>
                    <Button
                      color1={selectedOption === value ? "#FD7332" : "#0C1F3F"}
                      color2={selectedOption === value ? "#EF3826" : "#2E4161"}
                      style={styles.optionItem}
                      onPress={() => {
                        handleSelection(value);
                      }}
                      labelStyle={[
                        styles.optionText,
                        {
                          fontWeight: selectedOption === value ? "700" : "400",
                        },
                      ]}
                    >
                      {value}
                    </Button>
                  </View>
                );
              })}
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ marginTop: 30, flex: 0.4 }}>
                <Text children={"Backup Load Sub panel"} style={styles.backupTitle} />
                <View style={styles.info}>
                  <Image
                    style={{ width: 25, height: 25 }}
                    source={require("../../assets/Images/icons/info.png")}
                  />
                </View>
              </View>
              <View style={styles.secondsub}>
                <Button
                  //  color3={'#FFFFFF'}
                  color1={!formData.isExisting ? "#FD7332" : "#0C1F3F"}
                  color2={!formData.isExisting ? "#B92011" : "#2E4161"}
                  style={styles.btnItem}
                  onPress={() => {
                    handleInputChange("isExisting", false);
                  }}
                  labelStyle={styles.buttonText}
                >
                  New
                </Button>
                <Button
                  // color3={'#FFFFFF'}
                  color1={formData.isExisting ? "#FD7332" : "#0C1F3F"}
                  color2={formData.isExisting ? "#EF3826" : "#2E4161"}
                  style={styles.btnItem}
                  onPress={() => {
                    handleInputChange("isExisting", true);
                  }}
                  labelStyle={styles.buttonText}
                >
                  Existing
                </Button>
              </View>
            </View>

            <View style={styles.backupContainer}>
              <View style={styles.wholeHomebakcup}>
                <View style={{ width: 159 }}>
                  <Text children={"Bus Rating*"} style={styles.installer} />
                  <View style={{ flexDirection: "row" }}>
                    <DropdownComponent
                      label={"###"}
                      value={formData.busBarRating}
                      data={ampsRatings}
                      placeholderColor={"rgba(134, 137, 144, 1)"}
                      onChangeValue={(value: string) => {
                        handleInputChange("busBarRating", value);
                      }}
                    />
                    <Text children={"(Amps)"} style={[styles.installer, styles.ampsText]} />
                  </View>
                </View>
                <CameraOption
                  type={"BusRating"}
                  images={images}
                  setImages={handleSetImages}
                  camStyle={styles.cameraContainer}
                  onSave={debouncedSave}
                  loader={loading}
                />
              </View>
              <View style={{ width: 159 }}>
                <Text children={"Main Breaker Rating"} style={styles.installer} />
                <View style={{ flexDirection: "row" }}>
                  <DropdownComponent
                    label={"###"}
                    value={formData.mainBreakerRating}
                    data={ampsRatings}
                    placeholderColor={"rgba(134, 137, 144, 1)"}
                    onChangeValue={(value: string) => {
                      handleInputChange("mainBreakerRating", value);
                    }}
                  />
                  <Text children={"(Amps)"} style={[styles.installer, styles.ampsText]} />
                </View>
              </View>
              {isWholeBackup && (
                <View style={{ width: 159 }}>
                  <Text children={"Upstream Breaker Rating"} style={styles.installer} />
                  <View style={{ flexDirection: "row" }}>
                    <DropdownComponent
                      label={"###"}
                      value={formData.upstreamBreakerRating}
                      data={ampsRatings}
                      placeholderColor={"rgba(134, 137, 144, 1)"}
                      onChangeValue={(value: string) => {
                        handleInputChange("upstreamBreakerRating", value);
                      }}
                    />
                    <Text children={"(Amps)"} style={[styles.installer, styles.ampsText]} />
                  </View>
                </View>
              )}
            </View>
            {/* <View>
              <Text children={"Make"} style={styles.installer} />
              <View>
                <DropdownComponent
                  label={"###"}
                  onChangeValue={(value: string) => {
                    // setModalnumberValue(value);
                  }}
                  //   type={title}
                  //   value={values.modalNumber}
                  //   error={error.modelNumber}
                  data={[]}
                  placeholderColor={"rgba(134, 137, 144, 1)"}
                />
              </View>
            </View>
            <View>
              <Text children={"Model"} style={styles.installer} />
              <View>
                <DropdownComponent
                  label={"###"}
                  onChangeValue={(value: string) => {
                    // setModalnumberValue(value);
                  }}
                  //   type={title}
                  //   value={values.modalNumber}
                  //   error={error.modelNumber}
                  data={[]}
                  placeholderColor={"rgba(134, 137, 144, 1)"}
                />
              </View>
            </View> */}
            <EquipmentPicker
              type={`${systemType} Combiner Panel`}
              handleChange={function (equipmentUuid: any) {
                logger.info("equipwent ois", equipmentUuid);
                handleInputChange("equipmentUuid", equipmentUuid);
              }}
              manufacturer={currentData?.backupLoadSubpanel?.equipment?.manufacturer}
              uuid={currentData?.backupLoadSubpanel?.equipment?.uuid}
            />

            {/* {flag == 'partialHome' && (
              <View>
                <View style={{ marginTop: 20 }}>
                  <Text children={"Backup Loads"} style={styles.backupLoads} />
                  <View style={styles.infoBackup}>
                    <Image
                      style={{ width: 25, height: 25 }}
                      source={require("../../assets/Images/icons/info.png")}
                    />
                  </View>
                </View>
                <View style={{ flexDirection: "row", flex: 1, marginTop: 20 }}>
                  <Text
                    children={"Load Type*"}
                    style={{ flex: 0.8, color: "rgba(255, 255, 255, 0.5)" }}
                  />
                  <View style={{ flex: 0.3 }}>
                    <Text
                      children={"Breaker Rating (Amps)"}
                      style={{ color: "rgba(255, 255, 255, 0.5)" }}
                    />
                  </View>
                </View>
                <View style={styles.backupLoadsContainer}>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                    <View style={{ flex: 0.7 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                    <View style={{ flex: 0.3 }}>
                      <DropdownComponent
                        label={"###"}
                        onChangeValue={(value: string) => {
                          // setModalnumberValue(value);
                        }}
                        //   type={title}
                        //   value={values.modalNumber}
                        //   error={error.modelNumber}
                        data={[]}
                        placeholderColor={"rgba(134, 137, 144, 1)"}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )} */}
            {flag === "partialHome" && (
              <View>
                <View style={{ marginTop: 20 }}>
                  <Text children={"Backup Loads"} style={styles.backupLoads} />
                  <View style={styles.infoBackup}>
                    <Image
                      style={{ width: 25, height: 25 }}
                      source={require("../../assets/Images/icons/info.png")}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: "row", flex: 1, marginTop: 20 }}>
                  <Text
                    children={"Load Type*"}
                    style={{ flex: 0.8, color: "rgba(255, 255, 255, 0.5)" }}
                  />
                  <View style={{ flex: 0.3 }}>
                    <Text
                      children={"Breaker Rating (Amps)"}
                      style={{ color: "rgba(255, 255, 255, 0.5)" }}
                    />
                  </View>
                </View>

                {/* Loop over backupLoadData array */}
                {formData.backupLoadData.map((load, index) => (
                  <View key={index} style={styles.backupLoadsContainer}>
                    <View style={{ flexDirection: "row", flex: 1, gap: 20 }}>
                      <View style={{ flex: 0.7 }}>
                        <DropdownComponent
                          label={"###"}
                          onChangeValue={(value: string) => {
                            handleLoadInputChange(index, "loadType", value);
                          }}
                          value={load.loadType}
                          data={loadType} // Your dropdown data
                          placeholderColor={"rgba(134, 137, 144, 1)"}
                        />
                        {/* <TextInputField
                          label={"###"}
                          onChangeText={(value: string) => {
                            handleLoadInputChange(index, "loadType", value);
                          }}
                          //onBlur={handleBlur("loadType")}
                          value={load.loadType}
                          //error={touched.companyName && errors.companyName}
                        /> */}
                      </View>
                      <View style={{ flex: 0.3 }}>
                        <DropdownComponent
                          label={"###"}
                          onChangeValue={(value: string) => {
                            handleLoadInputChange(index, "loadCapacity", value);
                          }}
                          value={load.loadCapacity}
                          data={ampsRatings} // Your dropdown data
                          placeholderColor={"rgba(134, 137, 144, 1)"}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default WholeHomeBackupOption;

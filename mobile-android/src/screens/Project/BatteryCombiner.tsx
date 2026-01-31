import React, { useEffect, useRef, useState } from "react";
import { Image, SafeAreaView, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/batteryCombinerStyles";
import Text from "../../components/Text/index";
import Button from "../../components/Button";
import DropdownComponent from "../../components/Dropdown";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CameraOption } from "../Project/CameraOption";
import { SubHeaderComponent } from "../../components/Header/SubHeaderComponent";
import EquipmentPicker from "../../components/Project/EquipmentPicker";
import { ampsRatings, debugLogJson, omitNullValues } from "../../utils/utlityFunc";
import { debounce } from "lodash";
import { saveEnergySystemDetails } from "../../api/project.service";
import { useSelector } from "react-redux";
import logger from "../../utils/logger";

const BatteryCombiner = (props: any) => {
  const isFirstRender = useRef(true);
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<string | any>>();
  const { title, systemType, equipmentSetUuid, essUuid, currentData }: any = params;
  const [loading, setLoading] = useState(false);
  const company = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector((store: any) => store?.project?.currentProject?.uuid);
  const companyID = company?.company?.uuid;

  //const [images, setImages] = useState({ ESSMake: 0 });
  const [images, setImages] = useState({
    BusRating: [],
  });

  const [formData, setFormData] = useState({
    isExisting: false,
    busBarRating: "",
    equipmentUuid: "",
    mainBreakerRating: "",
    upstreamBreakerRating: "",
  });

  const handleInputChange = (name: any, value: any) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
    // debouncedSave();
  };

  useEffect(() => {
    if (!isFirstRender.current) {
      debouncedSave();
    } else {
      isFirstRender.current = false;
    }
  }, [formData]);

  useEffect(() => {
    if (currentData) {
      setFormData({
        isExisting: currentData?.batteryCombinerPanel?.isExisting || true,
        busBarRating: currentData?.batteryCombinerPanel?.busBarRating || "",
        equipmentUuid: currentData?.batteryCombinerPanel?.equipment?.uuid || "",
        mainBreakerRating: currentData?.batteryCombinerPanel?.mainBreakerRating || "",
        upstreamBreakerRating: currentData?.batteryCombinerPanel?.upstreamBreakerRating || "",
      });

      if (!!currentData?.batteryCombinerPanel?.equipmentImages) {
        setImages(currentData?.batteryCombinerPanel?.equipmentImages || {});
      }
    }
  }, [currentData]);

  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({
      ...prevImages,
      [type]: selectedImages,
    }));
  };

  async function saveFormData() {
    const payload = {
      uuid: essUuid,
      equipmentSetUuid,
      batteryCombinerPanel: {
        ...formData,
        equipmentImages: images,
      },
    };
    try {
      const response = await saveEnergySystemDetails(projectID, companyID, omitNullValues(payload));
      if (response?.status == 200) {
        console.log("response", response?.data);
      } else {
        console.log("Failed to save equipment details", JSON.stringify(response?.data));
      }
    } catch (error: any) {
      console.log(error?.message);
    } finally {
      setLoading(false);
    }
  }

  const debouncedSave: any = debounce(saveFormData, 1000);

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1, margin: 25 }}>
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={20}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
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
              //   children={`${title} \nBattery Combiner Panel`}
              children={"Microinverter 1 Battery Combiner Panel"}
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
            <SubHeaderComponent
              isInfo={true}
              isOptions={true}
              infoStyle={styles.info}
              isNew={!formData.isExisting}
              setIsNew={(isNew) => {
                handleInputChange("isExisting", !isNew);
              }}
              name={`Battery\nCombiner Panel`}
            />

            <View style={styles.backupContainer}>
              <View style={styles.wholeHomebakcup}>
                <View style={{ width: 159 }}>
                  <Text children={"Bus Rating (Amps)*"} style={styles.installer} />

                  <DropdownComponent
                    label={"###"}
                    value={formData.busBarRating}
                    data={ampsRatings}
                    placeholderColor={"rgba(134, 137, 144, 1)"}
                    onChangeValue={(value: string) => {
                      handleInputChange("busBarRating", value);
                    }}
                  />
                </View>
                <CameraOption
                  type={"BusRating"}
                  images={images}
                  setImages={handleSetImages}
                  camStyle={styles.cameraContainer}
                  loader={false}
                  onSave={debouncedSave}
                />
              </View>
              <View style={{ width: 159 }}>
                <Text children={"Main Breaker Rating (Amps)*"} style={styles.installer} />
                <DropdownComponent
                  label={"###"}
                  data={ampsRatings}
                  value={formData.mainBreakerRating}
                  placeholderColor={"rgba(134, 137, 144, 1)"}
                  onChangeValue={(value: string) => {
                    handleInputChange("mainBreakerRating", value);
                  }}
                />
              </View>

              <View style={{ width: 159 }}>
                <Text children={"Upstream Breaker Rating (Amps)*"} style={styles.installer} />
                <DropdownComponent
                  label={"###"}
                  data={ampsRatings}
                  value={formData.upstreamBreakerRating}
                  placeholderColor={"rgba(134, 137, 144, 1)"}
                  onChangeValue={(value: string) => {
                    handleInputChange("upstreamBreakerRating", value);
                  }}
                />
              </View>

              <EquipmentPicker
                type={`${systemType} Combiner Panel`}
                handleChange={function (equipmentUuid: any) {
                  logger.info("equipwent ois", equipmentUuid);
                  handleInputChange("equipmentUuid", equipmentUuid);
                }}
                manufacturer={currentData?.batteryCombinerPanel?.equipment?.manufacturer}
                uuid={currentData?.batteryCombinerPanel?.equipment?.uuid}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default BatteryCombiner;

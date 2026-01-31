import { FlatList, Image, StyleSheet, View } from "react-native";
import Button from "../../../../components/Button";
import { useEffect, useState } from "react";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import COLORS from "../../../../utils/styleConstant/Color";
import Text from "../../../../components/Text";
import LinearGradient from "react-native-linear-gradient";
import { CameraOption } from "../../CameraOption";
import DropdownComponent from "../../../../components/Dropdown";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";
import { BREAKER_LOCATIONS } from "../../../../utils/constants";
import { useNavigation } from "@react-navigation/native";

const InterconnectionComponent = ({
  interconnectionPoint,
  interconnectionData,
  setInterconnectionData,
  setInterconnectionPoint,
}: any) => {
  useEffect(() => {
    if (interconnectionData?.images) {
      setImages(interconnectionData?.images);
    }
  }, [interconnectionData]);

  const [images, setImages] = useState({ breaker_location: [] });
  const methods = ["Breaker", "Meter Collar\nAdapter", "Line Side Tap", "Load Side Tap"];
  const navigation: any = useNavigation();

  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({ ...prevImages, [type]: selectedImages }));
    setInterconnectionData({
      ...interconnectionData,
      images: { ...images, [type]: selectedImages },
    });
  };

  const FlatListItem = ({ index, item }: { index: number; item: string }) => {
    return (
      <View style={styles.listItemContainer}>
        <InfoIcon isgradientInfo={true} containerStyle={{ alignSelf: "center" }} />
        <Button
          children={item}
          key={index}
          color1={interconnectionPoint === item.replace("\n", " ") ? "#FD7332" : "#0C1F3F"}
          color2={interconnectionPoint === item.replace("\n", " ") ? "#EF3826" : "#2E4161"}
          onPress={() => {
            const point = item.replace("\n", " ");
            setInterconnectionPoint(point);
            if (point == "Load Side Tap" || point == "Line Side Tap") {
              setInterconnectionData({});
            }
          }}
          style={styles.optionItem}
          labelStyle={[
            styles.optionText,
            { fontWeight: interconnectionPoint === item ? "700" : "400" },
          ]}
        />
      </View>
    );
  };

  return (
    <View>
      <View style={{ rowGap: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.backupTitle} children={"Point of Interconnection"} />
          <InfoIcon isgradientInfo={true} containerStyle={{ marginTop: -10 }} />
        </View>
        <Text style={styles.subTitle} children={"Select your method of\ninterconnection*"} />
      </View>
      <FlatList
        data={methods}
        scrollEnabled={false}
        numColumns={2}
        columnWrapperStyle={{ columnGap: 20 }}
        contentContainerStyle={styles.listContainer}
        renderItem={({ index, item }) => <FlatListItem index={index} item={item} />}
      />
      {/*  If Meter Collar Adapter */}
      {interconnectionPoint === "Meter Collar Adapter" && (
        <View style={{ paddingTop: 20 }}>
          <LinearGradient
            colors={["#FD7332", "#EF3826"]}
            style={styles.gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={styles.backFeedContainer}>
            <Text children={"System Backfeed:"} style={styles.optionText} />
            <Text
              children={`${interconnectionData?.system_back_feed || "0"} Amps`}
              style={[styles.optionText, { fontWeight: "700" }]}
            />
          </View>
          <LinearGradient
            colors={["#FD7332", "#EF3826"]}
            style={styles.gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={styles.serviceList}>
            {[40, 60, 80].map((value) => (
              <View style={styles.serviceSection} key={value}>
                <Button
                  children={
                    interconnectionData?.system_back_feed === value ? (
                      <Image
                        source={require("../../../../assets/Images/icons/checkMark.png")}
                        style={styles.circleCheckMark}
                      />
                    ) : (
                      ""
                    )
                  }
                  color1={interconnectionData?.system_back_feed === value ? "#FD7332" : "#0C1F3F"}
                  color2={interconnectionData?.system_back_feed === value ? "#EF3826" : "#2E4161"}
                  onPress={() => {
                    if (interconnectionPoint == "Meter Collar Adapter") {
                      setInterconnectionData({ system_back_feed: value });
                    }
                  }}
                  style={styles.circleSelection}
                  labelStyle={styles.circleCheck}
                />
                <Text children={value + "A"} style={styles.optionText} />
              </View>
            ))}
          </View>
        </View>
      )}
      {/*  If Breaker */}
      {interconnectionPoint === "Breaker" && (
        <>
          <View style={styles.fieldsContainer}>
            <View style={{ flexDirection: "row" }}>
              <Text children={"Select System Breaker Location*"} style={styles.fieldName} />
              <InfoIcon
                containerStyle={{ marginTop: -10 }}
                onIconPress={() => {}}
                isgradientInfo={true}
              />
            </View>
            <CameraOption
              type={"breaker_location"}
              images={images}
              setImages={handleSetImages}
              camStyle={styles.cameraContainer}
            />
          </View>
          <DropdownComponent
            label={"Select Location"}
            placeholderColor={COLORS.grey}
            data={BREAKER_LOCATIONS}
            value={interconnectionData?.breaker_location}
            onChangeValue={(value: any) => {
              setInterconnectionData({
                images: { ...(interconnectionData?.images || {}) },
                breaker_location: value,
              });
            }}
          />
        </>
      )}
      <View
        style={[
          styles.btnContainer,
          {
            paddingVertical:
              interconnectionPoint === "Breaker"
                ? "5%"
                : interconnectionPoint === "Meter Collar Adapter"
                ? "10%"
                : "15%",
          },
        ]}
      >
        <Button
          children={"Continue"}
          color1={"#FD7332"}
          color2={"#EF3826"}
          onPress={() => {
            navigation.navigate("StructuralScreens");
          }}
          style={styles.continueBtn}
          labelStyle={[styles.optionText, { fontWeight: "700", lineHeight: 21 }]}
        />
      </View>
    </View>
  );
};

export default InterconnectionComponent;

const styles = StyleSheet.create({
  optionItem: {
    borderRadius: 5,
    flex: 1,
    height: 40,
  },
  circleCheck: {
    height: 30,
  },
  circleCheckMark: {
    height: 20,
    width: 20,
    tintColor: COLORS.white,
    resizeMode: "contain",
  },
  optionsContainer: {
    flexDirection: "row",
    columnGap: 20,
    paddingVertical: 20,
    paddingTop: 25,
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
    color: COLORS.white,
  },
  circleSelection: {
    width: 30,
    height: 30,
    borderRadius: 50,
  },
  continueBtn: {
    borderRadius: 5,
    width: "45%",
    height: 40,
    alignSelf: "center",
  },
  serviceList: {
    flexDirection: "row",
    flex: 1,
    alignContent: "center",
    paddingTop: 30,
  },
  serviceSection: {
    rowGap: 15,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  btnContainer: {
    flex: 1,
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 17,
  },
  backupTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  subTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "400",
    color: COLORS.white,
  },
  listItemContainer: {
    flex: 1,
    rowGap: 5,
  },
  fieldsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  cameraContainer: {
    alignSelf: "flex-start",
  },
  listContainer: {
    rowGap: 20,
    paddingVertical: 20,
  },
  backFeedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  gradientBorder: {
    paddingVertical: 1,
  },
});

// PanelComponent.tsx
// MIGRATED TO RESPONSIVE SYSTEM - 2025-10-15
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import DropdownComponent from "../../../../components/Dropdown";
import { CameraOption } from "../../CameraOption";
import Text from "../../../../components/Text";
import { SubHeaderComponent } from "../../../../components/Header/SubHeaderComponent";
import Button from "../../../../components/Button";
import COLORS from "../../../../utils/styleConstant/Color";
import CheckBox from "./CheckBox";
import {
  BREAKER_LOCATIONS,
  BUS_BAR_RATING,
  FEEDER_LOCATIONS,
  MAIN_CIRCUIT_BREAKER_RATINGS,
} from "../../../../utils/constants";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";
import { useResponsive } from "../../../../utils/responsive-v2";

interface PanelComponentProps {
  data: any;
  panelName: string;
  images: Array<any>;
  isServiceNew: string;
  onValueChange: (name: string, value: any) => void;
  setImages: (type: string, selectedImages: Array<any>) => void;
}

const PanelComponent = ({
  data,
  panelName,
  images,
  setImages,
  isServiceNew,
  onValueChange,
}: PanelComponentProps) => {
  const PanelType = panelName.split(" ").slice(1).join("");
  const r = useResponsive();

  console.log(data);

  const handleFormValueChange = (name: any, value: any) => {
    onValueChange(panelName, { [name]: value });
  };

  const styles = StyleSheet.create({
    backupContainer: {
      rowGap: r.spacing.sm,
      paddingBottom: r.spacing.md,
    },
    extraSub: {
      flexDirection: "row",
      justifyContent: "space-between",
      flex: 1,
      alignItems: "flex-end",
    },
    backupTitle: {
      fontFamily: fontFamily.lato,
      fontSize: r.fontSize(20),
      fontWeight: "700",
      color: COLORS.white,
    },
    fieldsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: r.spacing.sm,
    },
    cameraContainer: {
      alignSelf: "flex-start",
    },
    extraCam: {
      paddingBottom: "58%",
    },
    fieldsCheckContainer: {
      flexDirection: "row",
      paddingTop: r.spacing.sm,
      flex: 1,
    },
    fieldName: {
      fontFamily: fontFamily.lato,
      fontWeight: "700",
      fontSize: r.fontSize(14),
      color: "rgba(134, 137, 144, 1)",
      lineHeight: r.fontSize(17),
    },
    installer: {
      color: "rgba(134, 137, 144, 1)",
    },
    ampsText: {
      verticalAlign: "bottom",
      padding: r.spacing.sm,
      paddingBottom: r.fontSize(17),
    },
    optionText: {
      fontFamily: fontFamily.lato,
      fontWeight: "400",
      fontSize: r.fontSize(14),
      textAlign: "center",
      color: "#fff",
    },
    calcsBtn: {
      borderRadius: r.moderateScale(5),
      flex: 0.4,
      padding: r.spacing.xs,
      height: r.moderateScale(27),
    },
  });

  return (
    <View style={styles.backupContainer}>
      {panelName === "Main Panel A" ? (
        <View style={styles.extraSub}>
          <Text
            children={
              isServiceNew == "Yes"
                ? "New\nMain Panel A"
                : "Existing\nMain Panel A"
            }
            style={styles.backupTitle}
          />
          <Button
            children={"+ Load Calcs"}
            style={styles.calcsBtn}
            color1={data?.can_calculate_load ? "#FD7332" : "#0C1F3F"}
            color2={data?.can_calculate_load ? "#EF3826" : "#2E4161"}
            onPress={() =>
              handleFormValueChange(
                "can_calculate_load",
                !data?.can_calculate_load
              )
            }
            labelStyle={[
              styles.optionText,
              { fontWeight: data?.can_calculate_load ? "700" : "400" },
            ]}
          />
        </View>
      ) : (
        <SubHeaderComponent
          isInfo={false}
          isOptions={true}
          name={panelName}
          isNew={!data?.isExisting}
          setIsNew={(newValue) => {
            handleFormValueChange("isExisting", !newValue);
          }}
        />
      )}

      {/* name={"Solar Panel"}
              isInfo={true}
              isOptions={true}
              handleExisting={() => {}}
              isNew={formValues?.isNewSolarPanel}
              setIsNew={handleChange("isNewSolarPanel")}
              handleNew={() => {}} */}
      <View style={styles.fieldsContainer}>
        <View style={{ width: "40%" }}>
          <View style={{ flexDirection: "row" }}>
            <Text children={"Bus Bar Rating*"} style={styles.fieldName} />
            {panelName === "Main Panel A" && (
              <InfoIcon
                containerStyle={{ marginTop: -10 }}
                onIconPress={() => {}}
              />
            )}
          </View>
          <View style={{ flexDirection: "row" }}>
            <DropdownComponent
              label={"###"}
              data={BUS_BAR_RATING}
              value={data?.bus_bar_rating}
              placeholderColor={"rgba(134, 137, 144, 1)"}
              onChangeValue={(_: any) =>
                handleFormValueChange("bus_bar_rating", _)
              }
            />
            <Text
              children={"(Amps)"}
              style={[styles.installer, styles.ampsText]}
            />
          </View>
        </View>
        <CameraOption
          type={PanelType + "BusBar"}
          images={images}
          setImages={setImages}
          camStyle={[styles.cameraContainer, { marginTop: "-13%" }]}
        />
      </View>
      {panelName === "Main Panel A" ? (
        <View style={styles.fieldsCheckContainer}>
          <View style={{ width: "40%" }}>
            {isServiceNew === "Yes" ? (
              <View style={{ flexDirection: "row" }}>
                <Text
                  children={"Main Circuit\nBreaker Rating*"}
                  style={styles.fieldName}
                />
                {panelName === "Main Panel A" && (
                  <InfoIcon
                    containerStyle={{ marginTop: -10 }}
                    onIconPress={() => {}}
                  />
                )}
              </View>
            ) : (
              <Text
                children={"Main Circuit\nBreaker Rating*"}
                style={styles.fieldName}
              />
            )}
            <View style={{ flexDirection: "row" }}>
              <DropdownComponent
                label={"###"}
                value={data?.main_circuit_breaker_rating}
                data={MAIN_CIRCUIT_BREAKER_RATINGS}
                placeholderColor={"rgba(134, 137, 144, 1)"}
                onChangeValue={(_: any) =>
                  handleFormValueChange("main_circuit_breaker_rating", _)
                }
              />
              <Text
                children={"(Amps)"}
                style={[styles.installer, styles.ampsText]}
              />
            </View>
          </View>
          {isServiceNew === "No" && (
            <View style={{ width: "40%" }}>
              <CheckBox
                label={"Select if\nDerated"}
                isInfo={true}
                checked={data?.isDerated}
                onPress={() =>
                  handleFormValueChange("isDerated", !data?.isDerated)
                }
              />
            </View>
          )}
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <CameraOption
              type={PanelType + "MainCircuit"}
              images={images}
              setImages={setImages}
              camStyle={[
                styles.extraCam,
                { paddingBottom: isServiceNew === "No" ? "83%" : "28%" },
              ]}
            />
          </View>
        </View>
      ) : (
        <View style={styles.fieldsContainer}>
          <View style={{ width: "40%" }}>
            <View style={{ flexDirection: "row" }}>
              <Text children={"Main Circuit\nBreaker Rating*"} style={styles.fieldName} />
              {panelName === "Main Panel A" && (
                <InfoIcon
                  containerStyle={{ marginTop: -10 }}
                  onIconPress={() => {}}
                />
              )}
            </View>
            <View style={{ flexDirection: "row" }}>
              <DropdownComponent
                label={"###"}
                value={data?.main_circuit_breaker_rating}
                data={MAIN_CIRCUIT_BREAKER_RATINGS}
                placeholderColor={"rgba(134, 137, 144, 1)"}
                onChangeValue={(_: any) =>
                  handleFormValueChange("main_circuit_breaker_rating", _)
                }
              />
              <Text
                children={"(Amps)"}
                style={[styles.installer, styles.ampsText]}
              />
            </View>
          </View>
          <CameraOption
            images={images}
            setImages={setImages}
            type={PanelType + "MainCircuit"}
            camStyle={[styles.cameraContainer, { marginTop: "-13%" }]}
          />
        </View>
      )}
      <View style={{ paddingTop: 10 }}>
        <View style={[styles.fieldsContainer, { paddingTop: 0 }]}>
          <View style={{ flexDirection: "row" }}>
            <Text
              children={"Feeder location on Bus Bar*"}
              style={styles.fieldName}
            />
            {panelName === "Main Panel A" && (
              <InfoIcon
                containerStyle={{ marginTop: -10 }}
                onIconPress={() => {}}
              />
            )}
          </View>
          <CameraOption
            type={PanelType + "FeederLocation"}
            images={images}
            setImages={setImages}
            camStyle={styles.cameraContainer}
          />
        </View>
        <DropdownComponent
          label={"Select Location"}
          value={data?.feeder_location}
          placeholderColor={styles.installer.color}
          onChangeValue={(_: any) =>
            handleFormValueChange("feeder_location", _)
          }
          data={FEEDER_LOCATIONS}
        />
        {["PanelB", "PanelC", "PanelD"].includes(PanelType) && (
          <>
            <View style={[styles.fieldsContainer, { paddingTop: 0 }]}>
              <Text
                children={"Upstream Breaker Rating*"}
                style={styles.fieldName}
              />
              <CameraOption
                type={PanelType + "UpstreamBreaker"}
                images={images}
                setImages={setImages}
                camStyle={styles.cameraContainer}
              />
            </View>
            <DropdownComponent
              label={"Select Rating (Amps)"}
              placeholderColor={styles.installer.color}
              data={MAIN_CIRCUIT_BREAKER_RATINGS}
              value={data?.upstream_breaker_rating}
              onChangeValue={(_: any) =>
                handleFormValueChange("upstream_breaker_rating", _)
              }
            />
          </>
        )}
        {["PanelC", "PanelD"].includes(PanelType) && (
          <>
            <View style={[styles.fieldsContainer, { paddingTop: 0 }]}>
              <Text
                children={"Upstream Breaker Location*"}
                style={styles.fieldName}
              />
              <CameraOption
                images={images}
                setImages={setImages}
                camStyle={styles.cameraContainer}
                type={PanelType + "UpstreamLocation"}
              />
            </View>
            <DropdownComponent
              label={"Select Location"}
              placeholderColor={styles.installer.color}
              data={BREAKER_LOCATIONS}
              value={data?.upstream_breaker_location}
              onChangeValue={(_: any) =>
                handleFormValueChange("upstream_breaker_location", _)
              }
            />
          </>
        )}
      </View>
    </View>
  );
};

export default PanelComponent;

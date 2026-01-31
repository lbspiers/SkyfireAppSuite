import { StyleSheet, View } from "react-native";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import { useState } from "react";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import COLORS from "../../../../utils/styleConstant/Color";
import DropdownComponent from "../../../../components/Dropdown";
import CheckBox from "./CheckBox";
import AvoidUpgradeComponent from "./AvoidUpgradeComponent";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";

const HelpMeDecide = ({ serviceSelection }: { serviceSelection: (type: string) => void }) => {
  const [isScrewInFuses, setScrewInFuses] = useState("Yes");
  const [isChecked, setIsChecked] = useState(false);
  const [PanelManufacturers, setPanelManufacturers] = useState([
    "Challenger",
    "Federal Pacific",
    "GTE",
    "Pushmatic",
    "Stab-Loc",
    "Sylvania",
    "Zinsco",
  ]);
  const [SystemBackfeed, setSystemBackFeed] = useState(80);
  const [MainPanelBackfeed, setMainPanelBackFeed] = useState(60);

  const HighlightText = ({ label, value }: { label: string; value: number }) => {
    return (
      <View style={styles.backFeedContainer}>
        <Text children={label} style={styles.screwText} />
        <Text children={`${value} Amps`} style={[styles.screwText, { fontWeight: "700" }]} />
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <Text
        children={"Is the Existing Main Panel Manufacturer one of the following?"}
        style={[styles.Address, { width: "70%" }]}
      />
      <View>
        {PanelManufacturers.map((value, index) => (
          <Text children={value} style={styles.subTitle} key={index} />
        ))}
      </View>
      <Text children={"Or"} style={styles.Address} />
      <View>
        <Text children={"Does the panel have screw in fuses? "} style={styles.Address} />
        <Text children={"Are there visible signs of damage or aging?"} style={styles.Address} />
      </View>
    </>
  );

  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      {Array.from(["Yes", "No"]).map((value, index) => (
        <Button
          children={value}
          key={index}
          color1={isScrewInFuses === value ? "#FD7332" : "#0C1F3F"}
          color2={isScrewInFuses === value ? "#EF3826" : "#2E4161"}
          onPress={() => {
            setScrewInFuses(value);
          }}
          style={styles.optionItem}
          labelStyle={[styles.optionText, { fontWeight: isScrewInFuses === value ? "700" : "400" }]}
        />
      ))}
    </View>
  );

  const renderScrewInFusesYes = () => (
    <View style={styles.extraContainer}>
      <Text
        children={
          "The Existing Main Panel has Known potential fire safety issues and in most cases are un-insurable"
        }
        style={styles.screwText}
      />
      <Button
        children="Proceed with MPU"
        color1="#FD7332"
        color2="#EF3826"
        onPress={() => {
          serviceSelection("Yes");
        }}
        style={styles.proccedBtn}
        labelStyle={[styles.optionText, { fontWeight: "700" }]}
      />
    </View>
  );

  const renderScrewInFusesNo = () => (
    <View style={{ rowGap: 15 }}>
      {renderTextContainer()}
      <HighlightText label="System Backfeed:" value={SystemBackfeed} />
      {renderInfoSection()}
      {renderExistingMainPanel()}
      <HighlightText label="Allowable Main Panel Backfeed:" value={MainPanelBackfeed} />
      {renderComplianceSection()}
    </View>
  );

  const renderTextContainer = () => (
    <View style={styles.textContainer}>
      <Text style={styles.screwText}>
        Make sure you have all your solar equipment is entered in the
        <Text children={"Equipment"} style={[styles.screwText, { color: "#EF3826" }]} />
        section before{"\n"}proceeding
      </Text>
    </View>
  );

  const renderInfoSection = () => (
    <View style={{ alignItems: "center" }}>
      <InfoIcon onIconPress={() => {}} />
      <Text
        style={[styles.screwText, { width: "90%" }]}
        children={
          "Let's see if your Current System Backfeed and Existing Main Panel Complies with the 120% Rule"
        }
      />
    </View>
  );

  const renderExistingMainPanel = () => (
    <View>
      <Text children={"Existing Main Panel A"} style={[styles.subTitle, { textAlign: "center" }]} />
      <View style={styles.fieldsContainer}>
        {["Bus Bar rating*", "Main Circuit Breaker Rating*"].map((value, index, array) => (
          <View style={styles.fields} key={index}>
            <View style={styles.flexRowContainer}>
              <Text
                children={value}
                style={[
                  styles.fieldName,
                  {
                    marginTop: index == 1 ? "-7%" : 0,
                    marginBottom: index == 1 ? "-7%" : 0,
                  },
                ]}
              />
              <InfoIcon containerStyle={{ marginTop: -10 }} onIconPress={() => {}} />
            </View>
            <View style={[styles.flexRowContainer, { width: "90%" }]}>
              <DropdownComponent label={"###"} data={[]} placeholderColor={COLORS.grey} />
              <Text children={"(Amps)"} style={styles.ampsText} />
            </View>
          </View>
        ))}
      </View>
      {MainPanelBackfeed >= SystemBackfeed && (
        <View style={{ paddingHorizontal: 20 }}>
          <CheckBox
            checked={isChecked}
            isInfo={false}
            label={"Select if label\nis missing"}
            onPress={() => setIsChecked(!isChecked)}
          />
        </View>
      )}
      <View
        style={{
          paddingTop: MainPanelBackfeed >= SystemBackfeed ? 20 : 10,
          paddingBottom: 10,
        }}
      >
        <Button
          children="Calculate"
          color1="#FD7332"
          color2="#EF3826"
          onPress={() => {}}
          style={[styles.proccedBtn, { width: "45%" }]}
          labelStyle={[styles.optionText, { fontWeight: "700" }]}
        />
      </View>
    </View>
  );

  const renderComplianceSection = () =>
    MainPanelBackfeed <= SystemBackfeed ? (
      <AvoidUpgradeComponent />
    ) : (
      <View style={[styles.textContainer, { rowGap: 20, paddingBottom: 20 }]}>
        <Text style={[styles.screwText, { color: "green", fontWeight: "700" }]}>
          Compiles with the 120% Rule{"\n"}No Main Panel Upgrade Necessary
        </Text>
        <Button
          children="Continue"
          color1="#FD7332"
          color2="#EF3826"
          onPress={() => {
            serviceSelection("No");
          }}
          style={[styles.proccedBtn, { width: "50%" }]}
          labelStyle={[styles.optionText, { fontWeight: "700" }]}
        />
      </View>
    );

  return (
    <View style={{ rowGap: 10 }}>
      {renderHeader()}
      {renderOptions()}
      {isScrewInFuses === "Yes" ? renderScrewInFusesYes() : renderScrewInFusesNo()}
    </View>
  );
};

export default HelpMeDecide;

const styles = StyleSheet.create({
  Address: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: COLORS.lightWhite,
    lineHeight: 21,
    textAlign: "left",
  },
  subContainer: {
    alignItems: "center",
  },
  flexRowContainer: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
  },
  fields: {
    width: "41%",
  },
  backFeedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.grey,
    paddingVertical: 5,
  },
  fieldsContainer: {
    flexDirection: "row",
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: "rgba(134, 137, 144, 1)",
    lineHeight: 17,
  },
  proccedBtn: {
    borderRadius: 5,
    flex: 1,
    height: 40,
    alignSelf: "center",
    paddingHorizontal: 15,
  },
  subTitle: {
    fontFamily: fontFamily.lato,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  textContainer: {
    alignSelf: "center",
    width: "90%",
  },
  ampsText: {
    verticalAlign: "bottom",
    paddingTop: 10,
    color: COLORS.grey,
  },
  optionItem: {
    borderRadius: 5,
    flex: 1,
    height: 40,
  },
  extraContainer: {
    padding: 10,
    paddingHorizontal: 40,
    rowGap: 20,
    paddingBottom: 30,
  },
  optionsContainer: {
    flexDirection: "row",
    columnGap: 20,
    paddingVertical: 10,
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
  },
  screwText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.lightWhite,
    lineHeight: 21,
    textAlign: "center",
    flexWrap: "wrap",
  },
});

import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import StructuralSubHeader from './StructuralSubHeader';
import fontFamily from '../../../../utils/styleConstant/FontFamily';
import COLORS from '../../../../utils/styleConstant/Color';
import Text from '../../../../components/Text';
import Button from '../../../../components/Button';
import LinearGradient from 'react-native-linear-gradient';
import { CameraOption } from '../../CameraOption';
import RenderPlanes from './RenderPlanesContainer';
import AlertBox from '../../../../components/Alert';

const MountingPlanes = () => {
  const [isAllMountingPlanes, setAllMountingPlanes] = useState<boolean>(false);
  const [planes, setPlanes] = useState<{ id: number; selectedOption: string; addQuantity: boolean }[]>([
    { id: 1, selectedOption: 'Flush', addQuantity: false },
  ]);
  const [modal, setModal] = useState(false);
  const [planeId, setPlaneId] = useState(0);

  const [selectedType, setType] = useState<undefined | string>();
  const [images, setImages] = useState({
    Plane1: [],
    Plane2: [],
    Plane3: [],
    Plane4: [],
    Plane5: [],
    Plane6: [],
    Plane7: [],
    Plane8: [],
    Plane9: [],
    Plane10: [],
    Plane11: [],
    Plane12: [],
    Plane13: [],
    Plane14: [],
    Plane15: [],
  });

  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({
      ...prevImages,
      [type]: selectedImages,
    }));
  };

  const handleAddPlane = () => {
    const defaultOption = planes.length === 0 || planes[planes.length - 1].selectedOption === 'Ground' ? 'Ground' : 'Flush';

    if (planes.length < 15) {
      setPlanes((prevPlanes) => [
        ...prevPlanes,
        { id: prevPlanes.length + 1, selectedOption: defaultOption, addQuantity: false },
      ]);
    }
  };

  const handleDeletePlane = (id: number) => {
    setModal(true);
    setPlaneId(id);
  };

  const deletePlane = (id: number) => {
    setPlanes((prevPlanes) => prevPlanes.filter((plane) => plane.id !== id));
  };

  const toggleAddQuantity = (id: number) => {
    setPlanes((prevPlanes) =>
      prevPlanes.map((plane) =>
        plane.id === id ? { ...plane, addQuantity: !plane.addQuantity } : plane
      )
    );
  };

  const handleOptionChange = (planeId: number, option: string) => {
    setPlanes((prevPlanes) =>
      prevPlanes.map((plane) =>
        plane.id === planeId ? { ...plane, selectedOption: option } : plane
      )
    );
  };

  const getButtonText = useCallback(() => {
    const lastPlane = planes[planes.length - 1];
    return lastPlane && lastPlane.selectedOption === 'Ground' ? '+ Ground Mount' : '+ Mounting Plane';
  }, [planes]);

  return (
    <View>
      <StructuralSubHeader label="Mounting Planes" isInfo={true} />
      <View style={styles.firstContainer}>
        <Text
          style={[styles.fieldName, { fontWeight: '400', fontSize: 12 }]}
          children={"Select if all Mounting Planes\nhave the same Roof Pitch"}
        />
        <Button
          children={
            isAllMountingPlanes ? (
              <Image
                source={require('../../../../assets/Images/icons/checkMark.png')}
                style={styles.circleCheckMark}
              />
            ) : (
              ''
            )
          }
          color1={isAllMountingPlanes ? '#FD7332' : '#0C1F3F'}
          color2={isAllMountingPlanes ? '#EF3826' : '#2E4161'}
          onPress={() => setAllMountingPlanes(!isAllMountingPlanes)}
          style={styles.circleSelection}
          labelStyle={styles.circleCheck}
        />
      </View>
      <LinearGradient
        colors={['#FD7332', '#EF3826']}
        style={styles.gradientBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <FlatList
        data={planes}
        renderItem={({ item }) => (
          <RenderPlanes
            item={item}
            handleDeletePlane={handleDeletePlane}
            handleOptionChange={handleOptionChange}
            selectedType={selectedType}
            setType={setType}
            images={images}
            handleSetImages={handleSetImages}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      {planes.length < 15 && (
        <View style={{ paddingVertical: 20 }}>
          <Button
            children={getButtonText()}
            color1={'#0C1F3F'}
            color2={'#2E4161'}
            onPress={handleAddPlane}
            style={styles.continueBtn}
            labelStyle={[
              styles.optionText,
              { fontWeight: '700', lineHeight: 21 },
            ]}
          />
        </View>
      )}
      {modal && (
        <AlertBox
          isVisible={modal}
          message={
            "Are you sure you want to \n delete Mounting Plane"
          }
          label1={"Remove"}
          lable2={"Cancel"}
          closeModal={() => setModal(false)}
          button1onPress={() => {
            deletePlane(planeId);
          }}
          button2onPress={() => setModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 17,
  },
  circleCheckMark: {
    height: 20,
    width: 20,
    tintColor: COLORS.white,
    resizeMode: 'contain',
  },
  firstContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    rowGap: 10,
    paddingBottom: 15,
  },
  circleSelection: {
    width: 30,
    height: 30,
    borderRadius: 50,
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.white,
  },
  continueBtn: {
    borderRadius: 5,
    width: '45%',
    height: 40,
  },
  circleCheck: {
    height: 30,
  },
  gradientBorder: {
    paddingVertical: 1,
  },
});

export default MountingPlanes;

import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import SpeechText from '../../../components/SpeechText';

import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
// import {loginfn} from '../../../redux/actions/authActions';
import Text from '../../../components/Text';
import FontSize from '../../../utils/styleConstant/Font';
import FONTSIZE, {
  fontSizeExtra25Large,
} from '../../../utils/styleConstant/Font';
import fontFamily from '../../../utils/styleConstant/FontFamily';
import { login } from '../../../store/slices/authSlice';

const Home = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const loginAuth = () => {
    dispatch(login('vartiga'));
  };

   const name = useSelector((store) =>store?.auth?.user?.username );
  return (
    <View style={{flex: 1, backgroundColor: '#292C31'}}>
      <View
        style={{
          flex: 0.3,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <SpeechText />
      </View>

      <View style={{flex: 1, justifyContent: 'center', alignSelf: 'center'}}>
        {/* <CameraImage /> */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Camera')}
          style={{
            height: 50,
            width: 100,
            backgroundColor: 'skyblue',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontFamily: fontFamily.Inter_18pt_Black,
            }}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{flex: 0.4, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MeasurementComp')}
          style={{
            height: 50,
            width: 100,
            backgroundColor: 'pink',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Measurement</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={loginAuth}
          style={{
            height: 50,
            width: 100,
            backgroundColor: 'red',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>{name ?? 'Press to reveal'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Home;

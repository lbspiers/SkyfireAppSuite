module.exports = {
  project: {
    android: {
      packageName: 'com.skyfire.solarapp',
    },
  },
  assets: ['./src/assets/fonts'],
  dependencies: {
    'react-native-document-picker': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
  android: {
    unstable_reactLegacyComponentNames: [
      'AIRMap',
      'AIRMapCallout',
      'AIRMapCalloutSubview',
      'AIRMapCircle',
      'AIRMapHeatmap',
      'AIRMapLocalTile',
      'AIRMapMarker',
      'AIRMapOverlay',
      'AIRMapPolygon',
      'AIRMapPolyline',
      'AIRMapUrlTile',
      'AIRMapWMSTile',
    ],
  },
  ios:{
    unstable_reactLegacyComponentNames: [
      'AIRMap',
      'AIRMapCallout',
      'AIRMapCalloutSubview',
      'AIRMapCircle',
      'AIRMapHeatmap',
      'AIRMapLocalTile',
      'AIRMapMarker',
      'AIRMapOverlay',
      'AIRMapPolygon',
      'AIRMapPolyline',
      'AIRMapUrlTile',
      'AIRMapWMSTile',
    ],
  }
};

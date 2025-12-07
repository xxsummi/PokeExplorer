module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-maps/lib/android',
        },
        ios: {
          podspecPath: '../node_modules/react-native-maps/react-native-maps.podspec',
        },
      },
    },
  },
};

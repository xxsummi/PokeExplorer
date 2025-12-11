import firebase from '@react-native-firebase/app';

// Initialize Firebase - this will use GoogleService-Info.plist automatically
if (!firebase.apps.length) {
  // Firebase will auto-initialize from GoogleService-Info.plist
  // No manual config needed for React Native Firebase
}

export default firebase;

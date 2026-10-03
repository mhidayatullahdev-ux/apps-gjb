import Toast from 'react-native-toast-message';

export const toast = {
  success: (message, title = 'Berhasil') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 2500,
    });
  },
  error: (message, title = 'Gagal') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3500,
    });
  },
  info: (message, title = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 2500,
    });
  },
};

export default toast;
// src/context/NetworkContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext({
  isOnline: true,
  isSlow: false,
  connectionType: 'unknown',
});

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
      setConnectionType(state.type || 'unknown');

      const cellularGen = state.details?.cellularGeneration;
      setIsSlow(['2g', '3g'].includes(cellularGen));
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, isSlow, connectionType }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}

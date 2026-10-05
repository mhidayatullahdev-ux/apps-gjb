// src/context/FavoritesContext.js
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'dispora.favorites';
const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [facilityIds, setFacilityIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load dari storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (raw) {
          setFacilityIds(new Set(JSON.parse(raw)));
        }
      } catch (e) {
        // silent
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (set) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
    } catch {}
  };

  const toggleFavorite = useCallback((facilityId) => {
    const id = String(facilityId);
    setFacilityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (facilityId) => facilityIds.has(String(facilityId)),
    [facilityIds]
  );

  const list = [...facilityIds];

  return (
    <FavoritesContext.Provider
      value={{ favorites: list, isFavorite, toggleFavorite, loaded }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites harus di dalam FavoritesProvider');
  return ctx;
}

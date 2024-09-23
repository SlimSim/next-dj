"use client";

import { useEffect, useState } from 'react';
import { AppStoreNames, getDB } from '@/utils/db/get-db';

export type LoaderStatus = 'loading' | 'loaded' | 'error';

interface LoaderState<Result> {
  loading: boolean;
  status: LoaderStatus;
  value?: Result;
  error?: unknown;
}

export const useLoader = <Result>(storeName: AppStoreNames, key: number) => {
  const [state, setState] = useState<LoaderState<Result>>({
    loading: true,
    status: 'loading',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const result = await store.get(key);

        if (result) {
          setState({ status: 'loaded', loading: false, value: result as Result });
        } else {
          setState({ status: 'error', loading: false, error: new Error('Not found') });
        }
      } catch (error) {
        setState({ status: 'error', loading: false, error });
      }
    };

    fetchData();
  }, [storeName, key]);

  return state;
};
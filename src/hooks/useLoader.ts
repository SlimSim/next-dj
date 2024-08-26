"use client";

import { useEffect, useState } from 'react';
import { getDB } from '@/utils/db/get-db';
import type { AppStoreNames } from '@/types/entities';

export type LoaderStatus = 'loading' | 'loaded' | 'error';

interface LoaderState<Result> {
  status: LoaderStatus;
  value?: Result;
  error?: unknown;
}

export const useLoader = <Result>(storeName: AppStoreNames, key: number) => {
  const [state, setState] = useState<LoaderState<Result>>({
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
          setState({ status: 'loaded', value: result });
        } else {
          setState({ status: 'error', error: new Error('Not found') });
        }
      } catch (error) {
        setState({ status: 'error', error });
      }
    };

    fetchData();
  }, [storeName, key]);

  return state;
};
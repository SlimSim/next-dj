export const persist = <T>(storeName: string, instance: T, keys: (keyof T)[]): void => {
    keys.forEach((key) => {
      const fullKey = `snaeplayer-${storeName}.${String(key)}`;
      const valueRaw = localStorage.getItem(fullKey);
      const value = valueRaw === null || valueRaw === undefined ? null : JSON.parse(valueRaw);
      if (value !== null) {
        instance[key] = value;
      }
  
      let initial = true;
      const updateStorage = () => {
        const updatedValue = instance[key];
        if (initial) {
          initial = false;
          return;
        }
        localStorage.setItem(fullKey, JSON.stringify(updatedValue));
      };
  
      // Use a custom effect hook or similar to observe changes
      // For simplicity, this example assumes a function to observe changes
      observe(instance, key, updateStorage);
    });
  };
  
  // Example observer function (you'll need to implement this)
  function observe<T, K extends keyof T>(obj: T, key: K, callback: () => void) {
    // Implement observation logic here, e.g., using a library or custom hooks
  }
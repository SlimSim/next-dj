import React from "react";
import { useSnackbarItems } from "./store"; // Assume you have a React hook for snackbarItems
import Snackbar from "./Snackbar";

const SnackbarRenderer: React.FC = () => {
  const [snackbarItems, setSnackbarItems] = useSnackbarItems();

  const dismissHandler = (id: string) => {
    setSnackbarItems((items) => items.filter((item) => item.id !== id));
  };

  return snackbarItems.length !== 0 ? (
    <div className="flex flex-col gap-8px px-8px pb-16px bg-transparent w-full max-w-500px mx-auto">
      {snackbarItems.map((item) => (
        <div key={item.id} className="top-auto">
          <Snackbar {...item} onDismiss={dismissHandler} />
        </div>
      ))}
    </div>
  ) : null;
};

export default SnackbarRenderer;

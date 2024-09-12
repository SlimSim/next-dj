import React from "react";
import { observer } from "mobx-react-lite";
import Snackbar from "./Snackbar";
import { snackbarStore } from "../snackbarStore";

const SnackbarRenderer: React.FC = observer(() => {
  const { items, removeSnackbar } = snackbarStore;

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-8px px-8px pb-16px bg-transparent w-full max-w-500px mx-auto">
      {items.map((item) => (
        <div className="top-auto" key={item.id}>
          <Snackbar {...item} onDismiss={removeSnackbar} />
        </div>
      ))}
    </div>
  );
});

export default SnackbarRenderer;

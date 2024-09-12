import { v4 as uuidv4 } from 'uuid';
import { snackbarStore } from './snackbarStore';
import { SnackbarData } from './extra/Snackbar';

export type SnackbarOptions = SnackbarData;

export const snackbar = (newSnackbar: SnackbarOptions) => {
    console.log( "snackbar.ts -> newSnackbar", newSnackbar );
  newSnackbar.id = newSnackbar.id || uuidv4();
  
  snackbarStore.addSnackbar(newSnackbar);
};

export const dismissSnackbar = (id: string) => {
  snackbarStore.removeSnackbar(id);
};

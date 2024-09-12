import { makeAutoObservable } from 'mobx';
import type { SnackbarData } from './extra/Snackbar';

class SnackbarStore {
  items: SnackbarData[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addSnackbar(snackbar: SnackbarData) {
    const index = this.items.findIndex(item => item.id === snackbar.id);
    if (index > -1) {
      this.items[index] = snackbar;
    } else {
      this.items.push(snackbar);
    }
  }

  removeSnackbar = (id: string) => {
    this.items = this.items.filter(item => item.id !== id);
  };
}

export const snackbarStore = new SnackbarStore();

import type { SnackbarData } from './snackbarLogic'
import { snackbarItems } from './store'

export type SnackbarOptions = SnackbarData

export const snackbar = (newSnackbar: SnackbarOptions) => {
	const index = snackbarItems.findIndex((snackbar) => snackbar.id === newSnackbar.id)

	if (index > -1) {
		snackbarItems[index] = newSnackbar
	} else {
		snackbarItems.push(newSnackbar)
	}
}

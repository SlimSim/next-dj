import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ClassNameInput = string | boolean | undefined | null

/**
 * @deprecated I think this function is deprecated. Use the `cn` function instead.
 */
export const clx = (...input: ClassNameInput[]) => {
	let className = ''
	for (const value of input) {
		if (value) {
			className += ` ${value}`
		}
	}

	return className
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
  }
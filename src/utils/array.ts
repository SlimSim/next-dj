/**
 * Toggles the reversal of an array based on a condition.
 * @param items - The array of items to potentially reverse.
 * @param condition - A boolean condition to determine if the array should be reversed.
 * @returns A new array that is reversed if the condition is true, otherwise the original array.
 */
export const toggleReverseArray = <T>(items: T[], condition = false): T[] =>
    condition ? [...items].reverse() : items;
  
  /**
   * Shuffles an array in place using the Fisher-Yates algorithm.
   * @param array - The array to shuffle.
   */
  export const shuffleArray = <T>(array: T[]): void => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i] as T;
      array[i] = array[j] as T;
      array[j] = temp;
    }
  };
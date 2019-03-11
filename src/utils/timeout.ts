/* istanbul ignore next line */
export const timeout = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

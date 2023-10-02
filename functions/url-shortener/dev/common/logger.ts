interface Logger {
  log?: any,
  error?: any
}

export let c: Logger = {};

export const createLogWrapper = async (log: any, error: any) => {
  c.log = log;
  c.error = error;
} 
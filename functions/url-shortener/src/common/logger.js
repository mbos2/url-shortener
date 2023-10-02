export let c = {};
export const createLogWrapper = async (log, error) => {
    c.log = log;
    c.error = error;
};

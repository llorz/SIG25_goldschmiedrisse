import createModule from "../../native_utils";

export let sync_module;
export const module = createModule();
module.then(m => { sync_module = m; })
const store = new Map();

const FULLSOAK_APP_COMPONENTS_DIR = "FULLSOAK_APP_COMPONENTS_DIR";

const setGlobalComponentsDir = (dir: string) =>
  store.set(FULLSOAK_APP_COMPONENTS_DIR, dir);
const getGlobalComponentsDir = store.get(FULLSOAK_APP_COMPONENTS_DIR);

export { getGlobalComponentsDir, setGlobalComponentsDir };

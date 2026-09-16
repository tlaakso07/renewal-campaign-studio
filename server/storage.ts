/** Local files remain the renderer interface; hosted private objects hydrate on demand. */
let loader: (path: string) => Promise<void> = async () => {};
export const ensureLocalFile = (path: string) => loader(path);
export function setPrivateFileLoader(next: typeof loader) { loader = next; }

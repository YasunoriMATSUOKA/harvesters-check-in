/* eslint-disable @typescript-eslint/no-explicit-any */
(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
};
// eslint-disable-next-line @typescript-eslint/no-var-requires
(window as any).Buffer = (window as any).Buffer || require('buffer').Buffer;

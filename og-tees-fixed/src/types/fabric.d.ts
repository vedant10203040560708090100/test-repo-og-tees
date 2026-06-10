// Module declaration for fabric v5 which ships without bundled type definitions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module 'fabric' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabric: any;
  export { fabric };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default fabric;
}

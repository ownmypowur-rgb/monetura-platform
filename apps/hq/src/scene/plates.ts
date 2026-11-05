/**
 * Nameplates are HTML buttons outside the canvas (focusable, screen-reader friendly).
 * The scene writes their screen positions each frame through this map, so no React
 * re-render happens per frame.
 */
export const plateElements = new Map<string, HTMLElement>();

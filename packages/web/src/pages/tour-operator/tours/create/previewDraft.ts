/** Where the wizard parks a draft for the preview tab to pick up.
 *
 * Its own module so the wizard can reference the key without importing the preview page —
 * which would pull the whole traveller tour page into the wizard's bundle. */
export const TOUR_PREVIEW_KEY = 'tripavail:tour-preview'

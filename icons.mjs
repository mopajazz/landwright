// One 24-unit family. Silhouette carries meaning; color and arrows are not required.
const paths={
 path:'<path d="M5 22c0-7 14-13 14-20M11 22c0-7 14-13 14-20" transform="translate(-2 0)"/><path d="m10 17 2-2m2-4 2-2m1-4 1-2"/>',
 river:'<path d="M6 2c-8 8 17 12 6 20M14 2c-8 8 17 12 6 20"/><path d="m4 14 3 2m-2-2-1-3"/>',

 raise:'<path d="M2 21 9 5l7 16Z" fill="currentColor" fill-opacity=".2"/><path d="m6 12 3 3 3-3M18 3v7m-3-3.5h6"/>',
 lower:'<path d="M2 6h4c1 0 1 13 6 13S17 6 18 6h4v16H2Z" fill="currentColor" fill-opacity=".2"/><path d="M9 10h6"/>',
 smooth:'<path d="m7 4 14 5-4 10-14-5Z" fill="currentColor" fill-opacity=".2"/><path d="m3 14 14 5m-12-8 14 5M2 19h4m2 3h5"/>',
 flatten:'<rect x="2" y="8" width="20" height="9" rx="2" fill="currentColor" fill-opacity=".2"/><circle cx="12" cy="12.5" r="2"/><path d="M5 11v3m14-3v3M2 21h20"/>',
 land:'<path d="M3 12 7 4l5 2 5-2 4 6-5 4-7-1-4 3Z" fill="currentColor" fill-opacity=".2"/><path d="M2 20c3-3 5 3 8 0s5 3 8 0 3-1 4-1"/>',
 paint:'<path d="m8 13 9-10 4 4-10 9Z" fill="currentColor" fill-opacity=".2"/><path d="m15 5 4 4M9 15c-5-1-3 5-7 6 6 2 11-1 9-5"/>',
 erase:'<path d="m3 14 9-10a2 2 0 0 1 3 0l6 5a2 2 0 0 1 0 3l-8 9H9l-6-5a2 2 0 0 1 0-2Z" fill="currentColor" fill-opacity=".2"/><path d="m8 9 10 9M13 21h9"/>',
 pan:'<path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v10c0 5-3 7-7 7h-1c-3 0-4-1-6-4l-3-4a2 2 0 0 1 3-3l2 2Z" fill="currentColor" fill-opacity=".2"/>',
 settings:'<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="var(--panel)"/><circle cx="16" cy="12" r="2" fill="var(--panel)"/><circle cx="9" cy="18" r="2" fill="var(--panel)"/>'
};
export function toolIcon(name){return `<svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.paint}</svg>`;}

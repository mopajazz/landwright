// A single original icon family: 24-unit grid, restrained fills and clear silhouettes.
const paths={
 land:'<path d="m2 15 4-4 3 1 3-7 4 5 6-1M2 19c4-4 6 4 10 0s6 4 10 0"/>',
 raise:'<path d="M2 20 8 10l6 10H2Z"/><path d="m6 13 2 2 2-2M17 16V4m-4 4 4-4 4 4"/><path d="M12 21h10"/>',
 lower:'<path d="M2 6c4 0 4 14 9 14s5-14 9-14"/><path d="M11 4v10m-4-4 4 4 4-4M2 22h20"/>',
 smooth:'<path d="M2 15c4 0 4-8 8-8s4 8 8 8h4M2 20h20"/><path d="m15 5 2-2 2 2m-2-2v7"/>',
 flatten:'<path d="M3 16h18M5 20h14M12 3v9m-4-4 4 4 4-4"/><path d="m3 16 3-3m15 3-3-3"/>',
 paint:'<path d="m9 13 9-10 3 3-10 9-2-2Z"/><path d="M10 14c-5-2-6 3-5 5-1 1-2 1-3 1 5 3 11 0 9-5"/>',
 erase:'<path d="m4 13 8-9a2 2 0 0 1 3 0l6 5a2 2 0 0 1 0 3l-8 9H9l-5-5a2 2 0 0 1 0-3Z"/><path d="m8 9 10 9M12 21h10"/>',
 pan:'<path d="M12 2v20M2 12h20m-13-7 3-3 3 3m-6 14 3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3"/>'
};
export function toolIcon(name){return `<svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.paint}</svg>`;}

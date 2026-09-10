#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// Generates every image this sample ships.
//
// This repository is public domain and exists to be copied wholesale, which makes imagery a real
// constraint rather than housekeeping: a photograph found online, dropped into an Unlicense repo,
// poisons the licence for everyone who copies it downstream. Every image here is therefore
// *generated* -- authored by this script, owned by nobody, safe to redistribute on any terms.
//
// They are also SVG, which is deliberate. Each is under two kilobytes, so the blob-storage budget
// is a rounding error, and they stay sharp at any size without a responsive-image pipeline the
// sample would otherwise have to explain.
//
//   node assets/generate.mjs
//
// Deterministic: the same input produces byte-identical output, so re-running it never shows up
// as a diff.
// ---------------------------------------------------------------------------------------------

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * A coffee's image: concentric arcs over a warm ground, in the palette of its roast. Abstract on
 * purpose -- an image with words in it cannot be localized, and this sample is localized in the
 * second arc.
 */
function bagImage({ ground, ink, accent, seed }) {
  const rings = Array.from({ length: 5 }, (_, i) => {
    const r = 120 + i * 46
    const rotation = (seed * 47 + i * 31) % 360
    const dash = 40 + ((seed * 13 + i * 29) % 90)
    return `    <circle cx="400" cy="300" r="${r}" fill="none" stroke="${i % 2 ? accent : ink}" stroke-opacity="${(0.34 - i * 0.05).toFixed(2)}" stroke-width="${18 - i * 2}" stroke-dasharray="${dash} ${dash * 2}" transform="rotate(${rotation} 400 300)" stroke-linecap="round"/>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  <rect width="800" height="600" fill="${ground}"/>
  <g>
${rings}
  </g>
  <circle cx="400" cy="300" r="74" fill="${accent}" fill-opacity="0.9"/>
  <ellipse cx="400" cy="300" rx="30" ry="66" fill="${ground}" fill-opacity="0.85" transform="rotate(${(seed * 23) % 180} 400 300)"/>
</svg>
`
}

/** An origin's image: soft banded hills, one band per elevation step. */
function originImage({ ground, ink, accent, seed }) {
  const bands = Array.from({ length: 4 }, (_, i) => {
    const y = 260 + i * 64
    const lift = 50 + ((seed * 17 + i * 41) % 90)
    const shift = ((seed * 29 + i * 53) % 200) - 100
    return `  <path d="M0 ${y + 40} Q ${200 + shift} ${y - lift} 400 ${y} T 800 ${y - 20} L800 600 L0 600 Z" fill="${i % 2 ? accent : ink}" fill-opacity="${(0.16 + i * 0.12).toFixed(2)}"/>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  <rect width="800" height="600" fill="${ground}"/>
  <circle cx="${180 + ((seed * 37) % 440)}" cy="150" r="52" fill="${accent}" fill-opacity="0.55"/>
${bands}
</svg>
`
}

/**
 * A brew guide's figure: a stylised vessel and a falling stream, drawn rather than photographed.
 * Same reasoning as the rest -- and an abstract figure stays legible next to translated text.
 */
function brewImage({ ground, ink, accent, seed }) {
  const lean = ((seed * 19) % 40) - 20
  const drops = Array.from({ length: 6 }, (_, i) => {
    const y = 150 + i * 26
    const x = 400 + Math.round(Math.sin((seed + i) * 1.1) * 6)
    return `  <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 14}" stroke="${accent}" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round"/>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  <rect width="800" height="600" fill="${ground}"/>
  <g transform="rotate(${lean / 8} 400 300)">
    <path d="M300 300 L500 300 L440 470 L360 470 Z" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="10" stroke-linejoin="round"/>
    <path d="M320 330 L480 330" stroke="${accent}" stroke-opacity="0.6" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="400" cy="300" rx="100" ry="18" fill="none" stroke="${ink}" stroke-opacity="0.4" stroke-width="8"/>
  </g>
${drops}
  <circle cx="400" cy="110" r="26" fill="none" stroke="${ink}" stroke-opacity="0.35" stroke-width="8"/>
</svg>
`
}

const PALETTES = {
  light: { ground: '#f6ece0', ink: '#7a4a2a', accent: '#c07b3f' },
  medium: { ground: '#efdfcd', ink: '#5f3620', accent: '#a4522a' },
  dark: { ground: '#e6d3bd', ink: '#3d2418', accent: '#7c3d1c' },
  green: { ground: '#eae7d8', ink: '#4a5a3a', accent: '#7d8c55' },
}

const IMAGES = [
  // Coffees, in the order they appear in the catalogue.
  ['coffee-guji.svg', bagImage, 'light', 1],
  ['coffee-huila.svg', bagImage, 'medium', 2],
  ['coffee-yirgacheffe.svg', bagImage, 'light', 3],
  ['coffee-antigua.svg', bagImage, 'medium', 4],
  ['coffee-kirinyaga.svg', bagImage, 'light', 5],
  ['coffee-gayo.svg', bagImage, 'dark', 6],
  ['coffee-narino.svg', bagImage, 'medium', 7],
  ['coffee-hambela.svg', bagImage, 'dark', 8],
  // Brew guides.
  ['guide-pour-over.svg', brewImage, 'medium', 21],
  ['guide-aeropress.svg', brewImage, 'light', 22],
  ['guide-cafetiere.svg', brewImage, 'dark', 23],
  // Origins.
  ['origin-ethiopia.svg', originImage, 'green', 11],
  ['origin-colombia.svg', originImage, 'medium', 12],
  ['origin-guatemala.svg', originImage, 'green', 13],
  ['origin-kenya.svg', originImage, 'light', 14],
  ['origin-sumatra.svg', originImage, 'dark', 15],
]

mkdirSync(join(here, 'images'), { recursive: true })
for (const [name, draw, palette, seed] of IMAGES) {
  writeFileSync(join(here, 'images', name), draw({ ...PALETTES[palette], seed }), 'utf8')
  console.log(`assets/images/${name}`)
}

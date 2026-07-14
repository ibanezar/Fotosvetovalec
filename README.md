# Fotovreme

Hiperlokalni foto-vremenski planer za Zgornjo Savinjsko dolino. Povezuje astronomske izračune
zlate/modre ure s poznavanjem mikroklime in reliefa doline (npr. Logarska dolina, kjer sonce zaide
za grebenom precej prej kot kaže astronomski/ravninski izračun).

## Faza projekta

Trenutno gre za **SEO landing strani s približnim, statičnim izračunom** (astronomske formule +
ocenjena korekcija horizonta na lokacijo). Živa vremenska napoved (Open-Meteo) in natančnejša
DEM-korekcija reliefa sta načrtovani za naslednjo iteracijo, ko bo znano povpraševanje.

## Struktura

- **Hub:** `/` — Fotovreme, foto-vremenski planer
- **Spoke po lokaciji** (`src/pages/[locationSlug].astro`, podatki v `src/lib/locations.ts`):
  `/logarska-dolina`, `/mozirje`, `/golte`, `/recica-ob-savinji` — dodajanje nove lokacije pomeni
  le nov vnos v `locations.ts`.
- **Spoke po tipu fotografije** (`src/pages/[typeSlug].astro`, podatki v `src/lib/photoTypes.ts`):
  `/poroke`, `/pokrajina`, `/makro`

## Izračun sončnih časov

`src/lib/sunCalc.ts` uporablja knjižnico [suncalc](https://github.com/mourner/suncalc) za pozicijo
sonca in za vsako lokacijo doda korekcijo horizonta (`morningHorizonDeg` / `eveningHorizonDeg` v
`locations.ts`) — oceno kota, pod katerim okoliški greben zakrije sonce. To je ocena, ne meritev iz
DEM, kar je jasno označeno na straneh in v tabeli sončnih časov.

## Razvoj

```bash
npm install
npm run dev       # http://localhost:4321/fotosvetovalec/
npm run build      # statični izpis v dist/
npm run preview
```

## Deploy

`.github/workflows/deploy.yml` ob pushu na `main` zgradi stran in jo objavi na GitHub Pages
(`https://ibanezar.github.io/fotosvetovalec/`). Base pot je nastavljena v `astro.config.mjs` — če
stran kdaj seli na svojo domeno, odstrani `base` in po potrebi `site`.

# Fotovreme

Hiperlokalni foto-vremenski planer za Zgornjo Savinjsko dolino. Povezuje astronomske izračune
zlate/modre ure, pravo korekcijo reliefa iz digitalnega modela reliefa (DEM) in živo vremensko
napoved (Open-Meteo) — npr. v Logarski dolini sonce zaide za grebenom tudi tri ure prej kot kaže
astronomski/ravninski izračun, pozimi pa vzide na dnu doline ure za astronomskim vzhodom.

## Faza projekta

SEO landing strani z **realnim izračunom**: DEM-korekcija horizonta (ne več ocena) in živa
vremenska napoved za okna zlate/modre ure. Naslednji koraki: interaktivni vnos datuma poroke/dogodka
in razširitev na več lokacij.

## Struktura

- **Hub:** `/` — Fotovreme, foto-vremenski planer
- **Spoke po lokaciji** (`src/pages/[locationSlug].astro`, podatki v `src/lib/locations.ts`):
  `/logarska-dolina`, `/mozirje`, `/golte`, `/recica-ob-savinji` — dodajanje nove lokacije pomeni nov
  vnos v `locations.ts` **in** ponoven zagon `scripts/fetch-horizon-profiles.mjs` (glej spodaj).
- **Spoke po tipu fotografije** (`src/pages/[typeSlug].astro`, podatki v `src/lib/photoTypes.ts`):
  `/poroke`, `/pokrajina`, `/makro`

## Izračun sončnih časov in korekcija reliefa (DEM)

`src/lib/sunCalc.ts` uporablja [suncalc](https://github.com/mourner/suncalc) za pozicijo sonca in
`src/data/horizon-profiles.json` za realen profil obzorja vsake lokacije (36 smeri, do 16 km, iz
Open-Meteo elevation API / Copernicus DEM ~90 m ločljivosti). Za vsak dan poišče, kdaj sonce dejansko
prečka ta profil (ne le raven horizont) — z iterativnim usklajevanjem azimuta sonca in kota obzorja v
tisti smeri (glej `findTerrainCrossing`).

Profil obzorja je predizračunan in shranjen v repo (ni network klica ob vsakem buildu):

```bash
node scripts/fetch-horizon-profiles.mjs   # ponovno zaženi po dodani/premaknjeni lokaciji
```

## Vremenska napoved

`src/lib/weather.ts` ob vsakem buildu pokliče Open-Meteo forecast API (oblačnost, verjetnost dežja,
veter, temperatura, rosišče) in `src/components/WeatherTable.astro` jo poveže z izračunanimi okni
zlate/modre ure. Napoved je torej sveža toliko, kolikor je svež zadnji build strani — glej spodaj.

## Razvoj

```bash
npm install
npm run dev       # http://localhost:4321/Fotosvetovalec/
npm run build      # statični izpis v dist/
npm run preview
```

## Deploy

`.github/workflows/deploy.yml` zgradi in objavi stran na GitHub Pages
(`https://ibanezar.github.io/Fotosvetovalec/`) ob pushu na `main`, ročno (`workflow_dispatch`), in
vsakih 6 ur (`schedule`), da vremenska napoved ne zastara. Base pot je nastavljena v
`astro.config.mjs` — če stran kdaj seli na svojo domeno, odstrani `base` in po potrebi `site`.

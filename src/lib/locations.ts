export interface Location {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  elevation: number;
  /** Estimated horizon elevation angle (deg) blocking the rising sun — terrain, not DEM-measured. */
  morningHorizonDeg: number;
  /** Estimated horizon elevation angle (deg) blocking the setting sun — terrain, not DEM-measured. */
  eveningHorizonDeg: number;
  intro: string;
  orographyNote: string;
}

export const locations: Location[] = [
  {
    slug: 'logarska-dolina',
    name: 'Logarska dolina',
    region: 'Zgornja Savinjska dolina',
    lat: 46.3833,
    lon: 14.6333,
    elevation: 650,
    morningHorizonDeg: 7,
    eveningHorizonDeg: 13,
    intro:
      'Ledeniško oblikovana alpska dolina, obdana s strmimi grebeni Kamniško-Savinjskih Alp (Rinke, Ojstrica, Turska gora). Priljubljena lokacija za poročno in pokrajinsko fotografijo.',
    orographyNote:
      'Zahodni in južni greben sta visoka in blizu doline, zato sonce dejansko izgine za grebenom precej prej, kot kaže astronomski (ravninski) izračun zahoda — po naši oceni tudi uro do uro in pol prej, odvisno od letnega časa (glej tabelo zgoraj). Naš izračun to upošteva s korekcijo horizonta; za resnično zgodovinsko primerjavo pa dolgoročno pripravljamo natančnejšo korekcijo iz DEM (digitalni model reliefa).',
  },
  {
    slug: 'mozirje',
    name: 'Mozirje',
    region: 'Spodnja Zgornja Savinjska dolina',
    lat: 46.3389,
    lon: 14.9611,
    elevation: 327,
    morningHorizonDeg: 3,
    eveningHorizonDeg: 4,
    intro:
      'Mestece na širšem delu Savinjske doline, znano po Mozirskem gaju. Relief je tu bistveno bolj odprt kot v Logarski dolini, zato je razlika med astronomskim in dejanskim sončnim zahodom manjša.',
    orographyNote:
      'Dolina je tu širša, okoliški griči pa nižji, zato je korekcija horizonta manjša kot v Logarski dolini — po naši oceni približno pol ure prej zvečer in podobno zjutraj (glej tabelo zgoraj), ne pa ur, kot v ožjih delih doline.',
  },
  {
    slug: 'golte',
    name: 'Golte',
    region: 'Savinjske Alpe',
    lat: 46.3660,
    lon: 14.8020,
    elevation: 1400,
    morningHorizonDeg: 2,
    eveningHorizonDeg: 2,
    intro:
      'Planota in smučišče nad Mozirjem na okoli 1400 m, z odprtim razgledom na okoliške vrhove in dolino. Zaradi nadmorske višine je pogosto nad megleno odejo — odlična lokacija za inverzijo.',
    orographyNote:
      'Ker gre za odprto gorsko planoto, je horizont v večini smeri razmeroma odprt, korekcija je majhna. Glavni razlog za obisk ni prilagojen sončni zahod, temveč pogosta jesenska in zimska inverzija — megla spodaj v dolini, sonce nad njo.',
  },
  {
    slug: 'recica-ob-savinji',
    name: 'Rečica ob Savinji',
    region: 'Zgornja Savinjska dolina',
    lat: 46.3522,
    lon: 14.8867,
    elevation: 356,
    morningHorizonDeg: 4,
    eveningHorizonDeg: 5,
    intro:
      'Manjši kraj med Mozirjem in Lučami, izhodišče proti Golteh in Raduhi. Dolina je tu srednje široka, z zmerno korekcijo horizonta.',
    orographyNote:
      'Zmerno strmi obronki na obeh straneh doline skrajšajo dan glede na astronomski izračun — po naši oceni za približno 30–40 minut zvečer, odvisno od letnega časa in položaja sonca (glej tabelo zgoraj).',
  },
];

export function getLocation(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}

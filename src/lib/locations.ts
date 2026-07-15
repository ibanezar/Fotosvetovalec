export interface Location {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  /** Ground elevation (m) at lat/lon, from Open-Meteo's elevation API (Copernicus DEM). */
  elevation: number;
  intro: string;
  orographyNote: string;
}

export const locations: Location[] = [
  {
    slug: 'logarska-dolina',
    name: 'Logarska dolina',
    region: 'Zgornja Savinjska dolina',
    lat: 46.39495,
    lon: 14.62983,
    elevation: 768,
    intro:
      'Ledeniško oblikovana alpska dolina, obdana s strmimi grebeni Kamniško-Savinjskih Alp (Rinke, Ojstrica, Turska gora). Priljubljena lokacija za poročno in pokrajinsko fotografijo.',
    orographyNote:
      'Zahodni, južni in vzhodni greben so visoki in blizu doline, zato je neposredna sončna svetloba na dnu doline bistveno krajša, kot kaže astronomski (ravninski) izračun. Po izračunu iz digitalnega modela reliefa (DEM) sonce zvečer izgine za grebenom od približno ene ure (januar) do skoraj treh ur in pol (julij) prej kot astronomski zahod — zjutraj pa se v dolini pojavi tudi 2–4,5 ure kasneje kot astronomski vzhod, pozimi še precej kasneje. To je razlog, da nekateri deli Logarske doline pozimi tedne ne vidijo neposrednega sonca.',
  },
  {
    slug: 'mozirje',
    name: 'Mozirje',
    region: 'Spodnja Zgornja Savinjska dolina',
    lat: 46.33829,
    lon: 14.96495,
    elevation: 334,
    intro:
      'Mestece na širšem delu Savinjske doline, znano po Mozirskem gaju. Relief je tu bistveno bolj odprt kot v Logarski dolini, zato je razlika med astronomskim in dejanskim sončnim zahodom manjša.',
    orographyNote:
      'Dolina je tu širša, okoliški griči pa nižji, zato je korekcija iz DEM manjša kot v Logarski dolini — glede na letni čas med 20 in 65 minutami prej zvečer ter med 10 in 40 minutami kasneje zjutraj, ne pa ur, kot v ožjih delih doline.',
  },
  {
    slug: 'golte',
    name: 'Golte',
    region: 'Savinjske Alpe',
    lat: 46.385,
    lon: 14.822,
    elevation: 1196,
    intro:
      'Planota in smučišče nad Mozirjem na okoli 1200 m, z odprtim razgledom na okoliške vrhove in dolino. Zaradi nadmorske višine je pogosto nad megleno odejo — odlična lokacija za inverzijo.',
    orographyNote:
      'Ker gre za odprto gorsko planoto, je horizont v večini smeri razmeroma odprt — DEM izračun kaže korekcijo od 14 do 38 minut zvečer in do 20 minut zjutraj, torej precej manj kot v dolinah spodaj. Glavni razlog za obisk ni prilagojen sončni zahod, temveč pogosta jesenska in zimska inverzija — megla spodaj v dolini, sonce nad njo.',
  },
  {
    slug: 'recica-ob-savinji',
    name: 'Rečica ob Savinji',
    region: 'Zgornja Savinjska dolina',
    lat: 46.31667,
    lon: 14.91667,
    elevation: 360,
    intro:
      'Manjši kraj med Mozirjem in Lučami, izhodišče proti Golteh in Raduhi. Dolina je tu srednje široka, z zmerno korekcijo horizonta.',
    orographyNote:
      'Zmerno strmi obronki na obeh straneh doline skrajšajo dan glede na astronomski izračun — DEM izračun kaže med 20 in 45 minutami prej zvečer ter med 15 in 40 minutami kasneje zjutraj, odvisno od letnega časa in položaja sonca.',
  },
];

export function getLocation(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}

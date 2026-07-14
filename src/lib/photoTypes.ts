export interface PhotoType {
  slug: string;
  name: string;
  shortName: string;
  intro: string;
  factors: { title: string; description: string }[];
  bestWindow: string;
}

export const photoTypes: PhotoType[] = [
  {
    slug: 'poroke',
    name: 'Vreme za poročno fotografiranje',
    shortName: 'Poroke',
    intro:
      'Pri poročni fotografiji šteje vsaka minuta naravne svetlobe — zlata in modra ura sta pogosto edini termin za portrete para. Poleg svetlobe je pri poroki na prostem pomembna tudi verjetnost dežja in veter (pričeska, obleka, tančica).',
    factors: [
      {
        title: 'Zlata in modra ura',
        description:
          'Čas za mehke, tople portrete zunaj. Ker je urnik poroke fiksen (obredi, večerja), je ključno vedeti natančen lokalni čas zlate ure na dan poroke — in na konkretni lokaciji, kjer relief pogosto skrajša okno svetlobe.',
      },
      {
        title: 'Verjetnost dežja',
        description:
          'Napoved padavin ob obredu in med fotografiranjem na prostem — vpliva na izbiro lokacije (notranja/zunanja) in časovnico dneva.',
      },
      {
        title: 'Veter',
        description:
          'Močnejši veter razmršenih las in premikajočo se tančico/obleko pri portretih oteži, pri nekaterih parih pa je zaželen učinek — priporočamo preverbo napovedi vetra po urah.',
      },
      {
        title: 'Korekcija za relief lokacije',
        description:
          'V globokih dolinah (npr. Logarska dolina) sonce zaide za grebenom precej prej kot pravi astronomski izračun — naš planer to upošteva pri predlogu termina za portrete.',
      },
    ],
    bestWindow: 'Zlata ura pred sončnim zahodom in modra ura takoj po njem.',
  },
  {
    slug: 'pokrajina',
    name: 'Vreme za pokrajinsko fotografijo',
    shortName: 'Pokrajina',
    intro:
      'Pri pokrajinski fotografiji je najpomembnejša kombinacija jasnega neba (ali dramatične delne oblačnosti), vidljivosti gora in — v Zgornji Savinjski dolini pogosto — jesenske/zimske inverzije.',
    factors: [
      {
        title: 'Jasnost neba in oblačnost',
        description:
          'Popolnoma jasno nebo je redko najbolj dramatično — nekaj visoke oblačnosti pogosto da najboljše barve ob sončnem zahodu. Nizka, gosta oblačnost pa zakrije zaton v celoti.',
      },
      {
        title: 'Vidljivost gora',
        description:
          'Vlažnost zraka in delci (npr. poletna soparica) zmanjšajo kontrast in ostrino oddaljenih vrhov. Po deževju in ob severnem vetru je vidljivost običajno najboljša.',
      },
      {
        title: 'Inverzija',
        description:
          'Jesenski in zimski hladni jutranji zrak se pogosto nabere v dolini kot megla, medtem ko so vrhovi (npr. Golte) nad njo osončeni. Ena najbolj cenjenih, a težko napovedljivih priložnosti za pokrajinsko fotografijo v regiji.',
      },
    ],
    bestWindow: 'Zlata ura, ter jutra z inverzijo na razglednih točkah nad dolino.',
  },
  {
    slug: 'makro',
    name: 'Vreme za makro fotografijo',
    shortName: 'Makro',
    intro:
      'Makro fotografija (rosa, žuželke, cvetje) zahteva brezvetrno jutro in dovolj vlage za kapljice rose — a brez dežja v zadnjih urah, ki bi rastline in tla razmočil.',
    factors: [
      {
        title: 'Brezvetrje',
        description:
          'Tudi rahel vetrič pri makro fokusiranju z majhno globinsko ostrino pomeni zamegljen posnetek. Zgodnje jutro je običajno najbolj mirno.',
      },
      {
        title: 'Rosa (razlika temperature in rosišča)',
        description:
          'Rosa nastane, ko se temperatura zraka ponoči približa rosišču. Manjša kot je razlika ob zori, več rose je pričakovati na rastlinah.',
      },
      {
        title: 'Brez dežja zadnjih 12 ur',
        description:
          'Sveže deževje namoči tla in cvetje enakomerno, kar zabriše fine kapljice rose — za čist makro učinek je bolje, da je zadnjih 12 ur suho.',
      },
    ],
    bestWindow: 'Prva ura po sončnem vzhodu, dokler se rosa ne posuši in se dvigne veter.',
  },
];

export function getPhotoType(slug: string): PhotoType | undefined {
  return photoTypes.find((t) => t.slug === slug);
}

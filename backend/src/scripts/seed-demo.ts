import 'dotenv/config'
import mongoose, { Types } from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env'
import { User } from '../modules/users/user.model'
import { Breeder } from '../modules/breeders/breeder.model'
import { Breed } from '../modules/breeds/breed.model'
import { Listing, type IListing } from '../modules/listings/listing.model'
import { Inquiry, type InquiryStatus } from '../modules/inquiries/inquiry.model'
import { Review } from '../modules/reviews/review.model'
import { Favorite } from '../modules/favorites/favorite.model'
import { seedBreeds } from '../modules/breeds/breed.seed'
import { demoPhotos } from './demo-photos.generated'

/**
 * Демо-данные для защиты диплома: verified-заводчики с объявлениями,
 * покупатели, история продаж с отзывами, живые переписки и избранное.
 * Запуск: yarn seed-demo. Идемпотентен: свои прежние данные пересоздаёт,
 * чужие (созданные руками/тестами) не трогает.
 */

const DEMO_PASSWORD = 'Demo1234'
// Все demo-микрочипы начинаются этим префиксом — по нему чистим свои объявления
const CHIP_PREFIX = '616000090'

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(Date.now() - n * DAY)
const weeksAgo = (n: number) => daysAgo(n * 7)
const genderNoun = (gender: 'male' | 'female') => (gender === 'male' ? 'piesek' : 'suczka')
// «suczka czarna», ale «piesek czarny» — nazwa umaszczenia zgadza się z rodzajem
const colorAdjective = (color: string, gender: 'male' | 'female') =>
  gender === 'male' ? color : color.replace(/y\b/g, 'a')
// «w umaszczeniu czarnym» — miejscownik nazwy umaszczenia
const colorLocative = (color: string) => color.replace(/y\b/g, 'ym')

/**
 * Настоящие фото нужной породы и окраса, залитые в наш Cloudinary
 * (`yarn upload-demo-photos`). Ключи — из demo-photos.source.json.
 */
const photosOf = (key: string): string[] => {
  const list = demoPhotos[key]
  if (!list?.length) throw new Error(`Brak zdjęć demo dla klucza: ${key}`)
  return list
}

// У проданных щенков тот же набор фото породы, но с другим главным кадром
const rotated = (photos: string[], shift: number): string[] =>
  photos.map((_, i) => photos[(i + shift) % photos.length])

/**
 * timestamps: true перетирает createdAt при create, а сам путь createdAt
 * помечен immutable — через модель $set молча игнорируется. Поэтому датам
 * «исторических» записей (отзывы, прошлые продажи, переписки) правим прямо
 * в коллекции, минуя схему.
 */
const backdate = async (
  model: typeof Review | typeof Inquiry | typeof Listing,
  id: Types.ObjectId,
  createdAt: Date
) => {
  await model.collection.updateOne({ _id: id }, { $set: { createdAt, updatedAt: createdAt } })
}

interface SoldPuppy {
  puppyName: string
  gender: 'male' | 'female'
  color: string
  price: number
  photoKey: string
  // Недель назад состоялась продажа; сколько недель было щенку на момент отбору
  soldWeeksAgo: number
  ageWeeksAtSale: number
  buyer: number // индекс в DEMO_BUYERS
  rating: number
  reviewText: string
  reviewDaysAfterSale: number
  threadVariant: number
}

const DEMO_BREEDERS = [
  {
    email: 'hodowla.zlotalapa@demo.pedigreehub.pl',
    firstName: 'Katarzyna',
    lastName: 'Nowak',
    phone: '+48601100101',
    kennelName: 'Hodowla Złota Łapa',
    kennelRegistration: 'ZKwP-DEMO-001',
    // NIP-ы demo są fikcyjne, ale poprawne pod względem sumy kontrolnej
    nip: '5263005121',
    nipCompanyName: 'Hodowla Złota Łapa Katarzyna Nowak',
    kennelPhotoKey: 'kennel-zlota-lapa',
    region: 'mazowieckie',
    city: 'Warszawa',
    description:
      'Rodzinna hodowla labradorów z wieloletnim doświadczeniem. Nasze psy wychowują się w domu, wśród dzieci. Wszystkie szczenięta odchowywane zgodnie z wymogami ZKwP, z rodowodami i pełną dokumentacją weterynaryjną.',
    breedName: 'Labrador Retriever',
    breedTitle: 'Labrador retriever',
    listings: [
      {
        title: 'Labrador retriever — piękny piesek biszkoptowy',
        puppyName: 'Bruno',
        gender: 'male' as const,
        color: 'biszkoptowy',
        price: 4500,
        weeksOld: 9,
        photoKey: 'bruno-labrador-biszkoptowy',
        father: { name: 'Argo z Złotej Łapy', pedigreeNumber: 'PKR.VIII-45121', titles: ['Młodzieżowy Champion Polski'] },
        mother: { name: 'Bella ze Słonecznej Polany', pedigreeNumber: 'PKR.VIII-39887' },
        description:
          'Bruno to energiczny, ciekawski piesek o łagodnym charakterze. Odrobaczony, zaszczepiony, z książeczką zdrowia. Rodzice przebadani w kierunku dysplazji (HD-A). Gotowy do odbioru.',
      },
      {
        title: 'Labrador retriever — czekoladowa suczka',
        puppyName: 'Cora',
        gender: 'female' as const,
        color: 'czekoladowy',
        price: 5200,
        weeksOld: 10,
        photoKey: 'cora-labrador-czekoladowy',
        father: { name: 'Argo z Złotej Łapy', pedigreeNumber: 'PKR.VIII-45121' },
        mother: { name: 'Luna Brown Dream', pedigreeNumber: 'PKR.VIII-41230', titles: ['Champion Polski'] },
        description:
          'Cora to spokojna, przytulaśna suczka w rzadkim umaszczeniu czekoladowym. Socjalizowana z dziećmi i kotami. Komplet szczepień, chip, książeczka zdrowia.',
      },
      {
        title: 'Labrador retriever — czarny piesek po championach',
        puppyName: 'Dante',
        gender: 'male' as const,
        color: 'czarny',
        price: 4800,
        weeksOld: 8,
        photoKey: 'dante-labrador-czarny',
        father: { name: 'Black Thunder von Haus', pedigreeNumber: 'PKR.VIII-47001', titles: ['Champion Polski', 'Zwycięzca Klubu'] },
        mother: { name: 'Bella ze Słonecznej Polany', pedigreeNumber: 'PKR.VIII-39887' },
        description:
          'Dante pochodzi z championowskiego miotu. Świetny wybór zarówno na wystawy, jak i do rodziny. Odrobaczony, zaszczepiony wiekowo, zachipowany.',
      },
    ],
    soldHistory: [
      {
        puppyName: 'Figo',
        gender: 'male' as const,
        color: 'czarny',
        price: 4300,
        photoKey: 'dante-labrador-czarny',
        soldWeeksAgo: 22,
        ageWeeksAtSale: 9,
        buyer: 1,
        rating: 5,
        reviewDaysAfterSale: 12,
        threadVariant: 0,
        reviewText:
          'Figo jest z nami już pół roku i nie mogliśmy trafić lepiej. Pani Katarzyna od początku była w stałym kontakcie, przysyłała zdjęcia miotu, a przy odbiorze dostaliśmy komplet dokumentów i wyprawkę. Pies zdrowy, bez żadnych problemów.',
      },
      {
        puppyName: 'Hera',
        gender: 'female' as const,
        color: 'biszkoptowy',
        price: 4500,
        photoKey: 'bruno-labrador-biszkoptowy',
        soldWeeksAgo: 17,
        ageWeeksAtSale: 10,
        buyer: 2,
        rating: 5,
        reviewDaysAfterSale: 21,
        threadVariant: 1,
        reviewText:
          'Bardzo profesjonalna hodowla. Szczenięta odchowywane w domu, świetnie zsocjalizowane — Hera od pierwszego dnia była spokojna i czysta. Polecam każdemu, kto szuka labradora z prawdziwym rodowodem.',
      },
      {
        puppyName: 'Iskra',
        gender: 'female' as const,
        color: 'czekoladowy',
        price: 5000,
        photoKey: 'cora-labrador-czekoladowy',
        soldWeeksAgo: 12,
        ageWeeksAtSale: 11,
        buyer: 3,
        rating: 4,
        reviewDaysAfterSale: 9,
        threadVariant: 2,
        reviewText:
          'Suczka zdrowa i piękna, dokumenty w porządku. Jedyny minus to trochę długi czas oczekiwania na odpowiedzi na wiadomości, ale przy odbiorze wszystko przebiegło wzorowo. Ogólnie polecam.',
      },
      {
        puppyName: 'Jaro',
        gender: 'male' as const,
        color: 'biszkoptowy',
        price: 4400,
        photoKey: 'bruno-labrador-biszkoptowy',
        soldWeeksAgo: 8,
        ageWeeksAtSale: 9,
        buyer: 4,
        rating: 5,
        reviewDaysAfterSale: 14,
        threadVariant: 3,
        reviewText:
          'Kontakt na medal, hodowla otwarta na wizyty. Widzieliśmy rodziców, warunki i wyniki badań HD. Jaro rośnie zdrowo, a hodowczyni nadal pyta o jego postępy — takie podejście buduje zaufanie.',
      },
      {
        puppyName: 'Kaja',
        gender: 'female' as const,
        color: 'czarny',
        price: 4700,
        photoKey: 'dante-labrador-czarny',
        soldWeeksAgo: 4,
        ageWeeksAtSale: 10,
        buyer: 5,
        rating: 5,
        reviewDaysAfterSale: 6,
        threadVariant: 0,
        reviewText:
          'Kaja to najlepsza decyzja tego roku. Wszystkie szczepienia, odrobaczenia i chip zrobione, książeczka zdrowia prowadzona wzorowo. Dostaliśmy też wskazówki dotyczące żywienia na pierwsze tygodnie.',
      },
    ] satisfies SoldPuppy[],
  },
  {
    email: 'hodowla.poddebem@demo.pedigreehub.pl',
    firstName: 'Marek',
    lastName: 'Wiśniewski',
    phone: '+48601100102',
    kennelName: 'Hodowla Pod Dębem',
    kennelRegistration: 'ZKwP-DEMO-002',
    nip: '6751402334',
    nipCompanyName: 'Hodowla Pod Dębem Marek Wiśniewski',
    kennelPhotoKey: 'kennel-pod-debem',
    region: 'małopolskie',
    city: 'Kraków',
    description:
      'Kameralna hodowla golden retrieverów pod Krakowem. Stawiamy na zdrowie i temperament — wszystkie psy hodowlane z badaniami HD/ED i testami genetycznymi. Szczenięta odchowywane w domu z pełną socjalizacją.',
    breedName: 'Golden Retriever',
    breedTitle: 'Golden retriever',
    listings: [
      {
        title: 'Golden retriever — słoneczna suczka z rodowodem',
        puppyName: 'Nela',
        gender: 'female' as const,
        color: 'złoty',
        price: 5500,
        weeksOld: 11,
        photoKey: 'nela-golden-zloty',
        father: { name: 'Golden King of Sunshine', pedigreeNumber: 'PKR.VIII-50234', titles: ['Interchampion'] },
        mother: { name: 'Amber Pod Dębem', pedigreeNumber: 'PKR.VIII-48111' },
        description:
          'Nela to wyjątkowo łagodna i mądra suczka. Idealna do rodziny z dziećmi lub jako pies do dogoterapii. Rodzice z kompletem badań, szczenię z metryką i książeczką zdrowia.',
      },
      {
        title: 'Golden retriever — piesek o wspaniałym temperamencie',
        puppyName: 'Oskar',
        gender: 'male' as const,
        color: 'kremowy',
        price: 5000,
        weeksOld: 9,
        photoKey: 'oskar-golden-kremowy',
        father: { name: 'Golden King of Sunshine', pedigreeNumber: 'PKR.VIII-50234' },
        mother: { name: 'Daisy Morning Star', pedigreeNumber: 'PKR.VIII-46777' },
        description:
          'Oskar uwielbia ludzi i aport. Bardzo dobrze rokuje na psa rodzinnego. Odrobaczony, zaszczepiony, zachipowany, gotowy do odbioru od zaraz.',
      },
    ],
    soldHistory: [
      {
        puppyName: 'Lord',
        gender: 'male' as const,
        color: 'złoty',
        price: 5300,
        photoKey: 'nela-golden-zloty',
        soldWeeksAgo: 19,
        ageWeeksAtSale: 10,
        buyer: 6,
        rating: 5,
        reviewDaysAfterSale: 16,
        threadVariant: 2,
        reviewText:
          'Hodowla z klasą. Pan Marek zna się na rzeczy i nie ukrywa niczego — pokazał wyniki badań genetycznych obojga rodziców. Lord ma wspaniały temperament i świetnie ułożony charakter.',
      },
      {
        puppyName: 'Mia',
        gender: 'female' as const,
        color: 'kremowy',
        price: 4900,
        photoKey: 'oskar-golden-kremowy',
        soldWeeksAgo: 14,
        ageWeeksAtSale: 12,
        buyer: 7,
        rating: 4,
        reviewDaysAfterSale: 8,
        threadVariant: 3,
        reviewText:
          'Miła i uczciwa hodowla, szczeniak zdrowy i zadbany. Odbiór trwał dłużej, niż planowaliśmy, bo termin przesunął się o tydzień, ale hodowca uprzedził i wszystko wyjaśnił. Mia jest cudowna.',
      },
      {
        puppyName: 'Nord',
        gender: 'male' as const,
        color: 'złoty',
        price: 5100,
        photoKey: 'nela-golden-zloty',
        soldWeeksAgo: 9,
        ageWeeksAtSale: 9,
        buyer: 0,
        rating: 5,
        reviewDaysAfterSale: 11,
        threadVariant: 0,
        reviewText:
          'Nord przyjechał do nas zaszczepiony, zachipowany i z metryką — wszystko zgodnie z ustaleniami. Hodowca odpowiadał na pytania w kilka godzin, także po zakupie. Pełen profesjonalizm.',
      },
      {
        puppyName: 'Ola',
        gender: 'female' as const,
        color: 'złoty',
        price: 5400,
        photoKey: 'oskar-golden-kremowy',
        soldWeeksAgo: 5,
        ageWeeksAtSale: 11,
        buyer: 2,
        rating: 4,
        reviewDaysAfterSale: 7,
        threadVariant: 1,
        reviewText:
          'Ładna suczka o świetnym charakterze, dokumenty bez zarzutu. Cena wyższa niż średnia w regionie, ale patrząc na zdrowie i badania rodziców — uzasadniona.',
      },
    ] satisfies SoldPuppy[],
  },
  {
    email: 'hodowla.krolewskasfora@demo.pedigreehub.pl',
    firstName: 'Agnieszka',
    lastName: 'Kowalczyk',
    phone: '+48601100103',
    kennelName: 'Hodowla Królewska Sfora',
    kennelRegistration: 'ZKwP-DEMO-003',
    nip: '7790214011',
    nipCompanyName: 'Hodowla Królewska Sfora Agnieszka Kowalczyk',
    kennelPhotoKey: 'kennel-krolewska-sfora',
    region: 'wielkopolskie',
    city: 'Poznań',
    description:
      'Hodowla owczarków niemieckich z linii wystawowych. Ponad 15 lat doświadczenia, liczne tytuły championskie. Szczenięta po rodzicach z licencjami hodowlanymi ZKwP, z pełną dokumentacją i wsparciem hodowcy na całe życie psa.',
    breedName: 'Owczarek Niemiecki',
    breedTitle: 'Owczarek niemiecki',
    listings: [
      {
        title: 'Owczarek niemiecki — piesek z linii wystawowej',
        puppyName: 'Rex',
        gender: 'male' as const,
        color: 'czarny podpalany',
        price: 3800,
        weeksOld: 10,
        photoKey: 'rex-owczarek-czarny-podpalany',
        father: { name: 'Vito vom Königshaus', pedigreeNumber: 'PKR.I-88123', titles: ['Champion Polski'] },
        mother: { name: 'Xena Królewska Sfora', pedigreeNumber: 'PKR.I-85440' },
        description:
          'Rex to pewny siebie, zrównoważony piesek z doskonałą budową. Po rodzicach z badaniami HD/ED. Idealny na wystawy i do aktywnej rodziny.',
      },
      {
        title: 'Owczarek niemiecki — suczka długowłosa',
        puppyName: 'Sara',
        gender: 'female' as const,
        color: 'wilczasty',
        price: 3500,
        weeksOld: 12,
        photoKey: 'sara-owczarek-wilczasty',
        father: { name: 'Vito vom Königshaus', pedigreeNumber: 'PKR.I-88123' },
        mother: { name: 'Wega Królewska Sfora', pedigreeNumber: 'PKR.I-86002' },
        description:
          'Sara to inteligentna, oddana suczka o pięknej długiej sierści. Świetnie nadaje się do szkoleń i sportów kynologicznych. Komplet szczepień i dokumentów.',
      },
    ],
    soldHistory: [
      {
        puppyName: 'Puma',
        gender: 'female' as const,
        color: 'czarny podpalany',
        price: 3600,
        photoKey: 'rex-owczarek-czarny-podpalany',
        soldWeeksAgo: 16,
        ageWeeksAtSale: 10,
        buyer: 1,
        rating: 5,
        reviewDaysAfterSale: 18,
        threadVariant: 1,
        reviewText:
          'Puma to pies do wszystkiego — inteligentna, odważna, świetnie się szkoli. Hodowla ma ogromne doświadczenie i widać to w każdym szczególe. Pani Agnieszka pomogła nam nawet w doborze szkoły dla psa.',
      },
      {
        puppyName: 'Rambo',
        gender: 'male' as const,
        color: 'wilczasty',
        price: 3400,
        photoKey: 'sara-owczarek-wilczasty',
        soldWeeksAgo: 10,
        ageWeeksAtSale: 11,
        buyer: 3,
        rating: 4,
        reviewDaysAfterSale: 5,
        threadVariant: 2,
        reviewText:
          'Solidna hodowla wystawowa, rodowody i dokumenty w porządku. Rambo jest bardzo energiczny — dla nas to plus, ale warto wiedzieć, że to nie pies dla osoby szukającej spokojnego kanapowca.',
      },
      {
        puppyName: 'Sonia',
        gender: 'female' as const,
        color: 'czarny podpalany',
        price: 3700,
        photoKey: 'rex-owczarek-czarny-podpalany',
        soldWeeksAgo: 6,
        ageWeeksAtSale: 12,
        buyer: 7,
        rating: 3,
        reviewDaysAfterSale: 10,
        threadVariant: 3,
        reviewText:
          'Szczeniak zdrowy i z pełną dokumentacją, jednak sama obsługa mogłaby być lepsza. Na wiadomości czekaliśmy po kilka dni, a termin odbioru zmieniał się dwa razy. Sonia jest wspaniała, ale współpraca wymagała cierpliwości.',
      },
    ] satisfies SoldPuppy[],
  },
]

/**
 * Покупатели. Первый — основной тестовый аккаунт (у него специально
 * оставлена подтверждённая покупка без отзыва, чтобы проверить форму).
 */
const DEMO_BUYERS = [
  { email: 'kupujacy.demo@pedigreehub.pl', firstName: 'Piotr', lastName: 'Zieliński', phone: '+48601100200' },
  { email: 'anna.lewandowska@demo.pedigreehub.pl', firstName: 'Anna', lastName: 'Lewandowska', phone: '+48601100201' },
  { email: 'tomasz.jankowski@demo.pedigreehub.pl', firstName: 'Tomasz', lastName: 'Jankowski', phone: '+48601100202' },
  { email: 'magdalena.wojcik@demo.pedigreehub.pl', firstName: 'Magdalena', lastName: 'Wójcik', phone: '+48601100203' },
  { email: 'krzysztof.dabrowski@demo.pedigreehub.pl', firstName: 'Krzysztof', lastName: 'Dąbrowski', phone: '+48601100204' },
  { email: 'ewa.szymanska@demo.pedigreehub.pl', firstName: 'Ewa', lastName: 'Szymańska', phone: '+48601100205' },
  { email: 'michal.kaczmarek@demo.pedigreehub.pl', firstName: 'Michał', lastName: 'Kaczmarek', phone: '+48601100206' },
  { email: 'joanna.mazur@demo.pedigreehub.pl', firstName: 'Joanna', lastName: 'Mazur', phone: '+48601100207' },
]

/** Описания проданных объявлений — три варианта, чтобы история не выглядела шаблонной */
const SOLD_DESCRIPTIONS: ((name: string, gender: 'male' | 'female', color: string) => string)[] = [
  (name, gender, color) =>
    gender === 'male'
      ? `${name} to piesek w umaszczeniu ${colorLocative(color)}. Odchowany w domu, wśród ludzi i innych psów. Komplet szczepień, odrobaczenie, chip i książeczka zdrowia. Rodzice z badaniami HD/ED i rodowodami ZKwP.`
      : `${name} to suczka w umaszczeniu ${colorLocative(color)}. Odchowana w domu, wśród ludzi i innych psów. Komplet szczepień, odrobaczenie, chip i książeczka zdrowia. Rodzice z badaniami HD/ED i rodowodami ZKwP.`,
  (name, gender, color) =>
    gender === 'male'
      ? `${name} — spokojny, dobrze zsocjalizowany piesek w umaszczeniu ${colorLocative(color)}. Szczenię wychowane w hodowli pod stałą opieką weterynarza, z metryką ZKwP i pełną dokumentacją.`
      : `${name} — spokojna, dobrze zsocjalizowana suczka w umaszczeniu ${colorLocative(color)}. Szczenię wychowane w hodowli pod stałą opieką weterynarza, z metryką ZKwP i pełną dokumentacją.`,
  (name, gender, color) =>
    gender === 'male'
      ? `${name} pochodzi z planowanego miotu po rodzicach z licencją hodowlaną. Piesek w umaszczeniu ${colorLocative(color)}, zaszczepiony wiekowo, zachipowany, gotowy do odbioru wraz z dokumentami.`
      : `${name} pochodzi z planowanego miotu po rodzicach z licencją hodowlaną. Suczka w umaszczeniu ${colorLocative(color)}, zaszczepiona wiekowo, zachipowana, gotowa do odbioru wraz z dokumentami.`,
]

/** Переписки, приведшие к покупке — 4 варианта с подстановкой кличек */
const PURCHASE_THREADS: ((ctx: {
  puppyName: string
  gender: 'male' | 'female'
}) => { from: 'buyer' | 'breeder'; text: string; daysBeforeSale: number }[])[] = [
  ({ puppyName, gender }) => [
    {
      from: 'buyer',
      text:
        gender === 'male'
          ? `Dzień dobry! Piszemy w sprawie ogłoszenia — czy ${puppyName} jest jeszcze dostępny?`
          : `Dzień dobry! Piszemy w sprawie ogłoszenia — czy ${puppyName} jest jeszcze dostępna?`,
      daysBeforeSale: 12,
    },
    { from: 'breeder', text: `Dzień dobry! Tak, ${puppyName} czeka na nowy dom. Zapraszam do hodowli — można poznać rodziców i zobaczyć, w jakich warunkach odchowujemy mioty.`, daysBeforeSale: 11 },
    { from: 'buyer', text: 'Byliśmy w weekend i wszystko bardzo nam się spodobało. Potwierdzamy zakup.', daysBeforeSale: 1 },
    { from: 'breeder', text: 'Bardzo się cieszę! Na dzień odbioru przygotuję metrykę, książeczkę zdrowia i umowę.', daysBeforeSale: 0 },
  ],
  ({ puppyName, gender }) => [
    { from: 'buyer', text: `Dobry wieczór, szukamy spokojnego szczeniaka do domu z dziećmi. Czy ${puppyName} nadaje się dla niedoświadczonych właścicieli?`, daysBeforeSale: 15 },
    {
      from: 'breeder',
      text:
        gender === 'male'
          ? `Dobry wieczór! ${puppyName} jest zrównoważony i dobrze zsocjalizowany z dziećmi. Chętnie odpowiem na wszystkie pytania też telefonicznie.`
          : `Dobry wieczór! ${puppyName} jest zrównoważona i dobrze zsocjalizowana z dziećmi. Chętnie odpowiem na wszystkie pytania też telefonicznie.`,
      daysBeforeSale: 14,
    },
    { from: 'buyer', text: 'Dziękujemy za rozmowę i przesłane materiały. Decydujemy się na tego szczeniaka.', daysBeforeSale: 2 },
    { from: 'breeder', text: 'Świetna wiadomość! Wyślę listę rzeczy przydatnych na pierwsze dni w nowym domu.', daysBeforeSale: 1 },
  ],
  () => [
    { from: 'buyer', text: 'Dzień dobry, czy rodzice szczeniaka mają badania w kierunku dysplazji? Chcielibyśmy zobaczyć wyniki.', daysBeforeSale: 9 },
    { from: 'breeder', text: 'Dzień dobry! Oczywiście — oboje rodzice mają wyniki HD/ED, prześlę skany. Rodowody są też widoczne w ogłoszeniu.', daysBeforeSale: 9 },
    { from: 'buyer', text: 'Wszystko się zgadza, dokumenty w porządku. Potwierdzamy zakup.', daysBeforeSale: 1 },
    { from: 'breeder', text: 'Dziękuję za zaufanie. Do zobaczenia przy odbiorze!', daysBeforeSale: 0 },
  ],
  ({ puppyName }) => [
    { from: 'buyer', text: 'Witam, czy możliwy jest późniejszy odbiór szczeniaka? Wyjeżdżamy i chcielibyśmy być wtedy na miejscu.', daysBeforeSale: 20 },
    { from: 'breeder', text: `Witam! Tak, możemy ustalić inny termin — ${puppyName} zostanie u nas do tego czasu.`, daysBeforeSale: 19 },
    { from: 'buyer', text: 'Idealnie, w takim razie potwierdzamy. Zaliczka przelana.', daysBeforeSale: 3 },
    { from: 'breeder', text: 'Potwierdzam otrzymanie zaliczki. Będę wysyłać zdjęcia z rozwoju miotu.', daysBeforeSale: 2 },
  ],
]

/**
 * Живые переписки без покупки — по одной в każdym statusie, żeby panel
 * hodowcy i skrzynka kupującego nie były puste.
 */
const OPEN_INQUIRIES: {
  breeder: number
  listing: number
  buyer: number
  status: InquiryStatus
  buyerUnread: number
  breederUnread: number
  messages: { from: 'buyer' | 'breeder'; text: string; daysAgo: number }[]
}[] = [
  {
    breeder: 2,
    listing: 0,
    buyer: 5,
    status: 'new',
    buyerUnread: 0,
    breederUnread: 1,
    messages: [
      {
        from: 'buyer',
        text: 'Dzień dobry, czy Rex jest jeszcze dostępny? Mieszkamy pod Poznaniem, mamy duży ogrodzony teren i doświadczenie z owczarkami.',
        daysAgo: 0.3,
      },
    ],
  },
  {
    breeder: 0,
    listing: 1,
    buyer: 6,
    status: 'read',
    buyerUnread: 0,
    breederUnread: 0,
    messages: [
      {
        from: 'buyer',
        text: 'Dobry wieczór! Czy Cora może zostać w hodowli jeszcze dwa tygodnie? Kończymy remont i chcielibyśmy odebrać ją do gotowego domu.',
        daysAgo: 2,
      },
    ],
  },
  {
    breeder: 0,
    listing: 2,
    buyer: 7,
    status: 'in_progress',
    buyerUnread: 1,
    breederUnread: 0,
    messages: [
      { from: 'buyer', text: 'Dzień dobry, interesuje mnie Dante. Czy mógłby wziąć udział w wystawach? Zależy nam na psie o dobrej budowie.', daysAgo: 4 },
      {
        from: 'breeder',
        text: 'Dzień dobry! Dante ma bardzo dobrą budowę i pochodzi z championowskiego miotu, więc na wystawy rokuje świetnie. Mogę przesłać zdjęcia w postawie.',
        daysAgo: 3,
      },
      { from: 'buyer', text: 'Poproszę, i jeszcze pytanie o wyniki badań rodziców.', daysAgo: 2 },
      {
        from: 'breeder',
        text: 'Wysłałam zdjęcia na maila, skany HD/ED też są w załączniku. Zapraszam na wizytę w dowolny weekend.',
        daysAgo: 1,
      },
    ],
  },
  {
    breeder: 2,
    listing: 1,
    buyer: 2,
    status: 'closed',
    buyerUnread: 0,
    breederUnread: 0,
    messages: [
      { from: 'buyer', text: 'Witam, czy Sara dobrze czuje się w mieszkaniu w bloku? Mamy 60 m² i pracujemy zdalnie.', daysAgo: 11 },
      {
        from: 'breeder',
        text: 'Witam! Sara jest bardzo aktywna i potrzebuje dużo ruchu — w bloku będzie to wymagało minimum dwóch długich spacerów dziennie i pracy węchowej.',
        daysAgo: 10,
      },
      {
        from: 'buyer',
        text: 'Dziękuję za szczerość. W takim razie zrezygnujemy — nie chcemy, żeby pies był niedostatecznie wybiegany.',
        daysAgo: 9,
      },
    ],
  },
]

async function upsertUser(data: {
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'user' | 'breeder'
}) {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12)
  const existing = await User.findOne({ email: data.email })
  if (existing) {
    existing.role = data.role
    existing.password = hashedPassword
    existing.isEmailVerified = true
    existing.isBlocked = false
    await existing.save()
    return existing
  }
  return User.create({
    ...data,
    password: hashedPassword,
    isEmailVerified: true,
    isVerified: true,
  })
}

/** Пересчёт рейтинга заводчика по отзывам (как в review.service) */
async function recalculateRating(breederId: Types.ObjectId) {
  const [stats] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { breederId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await Breeder.updateOne(
    { _id: breederId },
    {
      $set: {
        rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
        reviewsCount: stats ? stats.count : 0,
      },
    }
  )
}

async function seedDemo() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Seeding danych demo...')

  await seedBreeds()

  // Чистим свои прежние demo-сущности (по known email'ам и chip-префиксу)
  const demoEmails = [...DEMO_BREEDERS.map((b) => b.email), ...DEMO_BUYERS.map((b) => b.email)]
  const oldUsers = await User.find({ email: { $in: demoEmails } })
  const oldUserIds = oldUsers.map((u) => u._id)
  const oldBreeders = await Breeder.find({ userId: { $in: oldUserIds } })
  const oldBreederIds = oldBreeders.map((b) => b._id)
  await Review.deleteMany({ $or: [{ buyerId: { $in: oldUserIds } }, { breederId: { $in: oldBreederIds } }] })
  await Inquiry.deleteMany({ $or: [{ buyerId: { $in: oldUserIds } }, { breederId: { $in: oldBreederIds } }] })
  await Favorite.deleteMany({ userId: { $in: oldUserIds } })
  await Listing.deleteMany({ microchipNumber: { $regex: `^${CHIP_PREFIX}` } })

  const buyers = []
  for (const b of DEMO_BUYERS) {
    buyers.push(await upsertUser({ ...b, role: 'user' }))
  }

  let chipCounter = 0
  const nextChip = () => {
    chipCounter += 1
    return `${CHIP_PREFIX}${String(chipCounter).padStart(6, '0')}`
  }

  const created: {
    data: (typeof DEMO_BREEDERS)[number]
    breederId: Types.ObjectId
    userId: Types.ObjectId
    activeListings: IListing[]
  }[] = []

  for (const b of DEMO_BREEDERS) {
    const user = await upsertUser({
      email: b.email,
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phone,
      role: 'breeder',
    })

    const breed = await Breed.findOne({ name: b.breedName })
    if (!breed) throw new Error(`Nie znaleziono rasy: ${b.breedName}`)

    const verification = {
      status: 'verified',
      level: 'verified',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      nip: b.nip,
      nipVerified: true,
      nipVerifiedAt: new Date(),
      nipCompanyName: b.nipCompanyName,
      nipPkd: '01.49.Z',
      zkwpVerified: false,
      identityVerified: false,
      breedingDogs: [],
      awards: [],
    }

    const breeder = await Breeder.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          kennelName: b.kennelName,
          kennelRegistration: b.kennelRegistration,
          region: b.region,
          city: b.city,
          description: b.description,
          breeds: [breed._id],
          breedNames: [b.breedName],
          verification,
          badges: ['email_verified', 'nip_verified'],
          kennelPhotos: photosOf(b.kennelPhotoKey),
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const activeListings: IListing[] = []
    for (const l of b.listings) {
      const listing = await Listing.create({
        breederId: breeder._id,
        breed: breed._id,
        title: l.title,
        description: l.description,
        price: l.price,
        currency: 'PLN',
        puppyName: l.puppyName,
        birthDate: weeksAgo(l.weeksOld),
        gender: l.gender,
        color: l.color,
        microchipNumber: nextChip(),
        hasPedigree: false,
        hasVetPassport: false,
        hasMetric: false,
        father: l.father,
        mother: l.mother,
        photos: photosOf(l.photoKey),
        status: 'active',
        verificationStatus: 'verified',
        publishedAt: new Date(),
        location: { region: b.region, city: b.city },
        viewsCount: 20 + Math.floor(Math.random() * 180),
        inquiriesCount: 0,
        favoritesCount: 0,
        autoChecks: {
          microchipFormatValid: true,
          pedigreeFormatValid: true,
          documentsUploaded: true,
          dataConsistency: true,
          passedAt: new Date(),
        },
      })
      activeListings.push(listing)
    }

    // История продаж: проданное объявление + переписка с подтверждённой покупкой + отзыв
    for (const [index, sold] of b.soldHistory.entries()) {
      const buyer = buyers[sold.buyer]
      const soldAt = weeksAgo(sold.soldWeeksAgo)
      const publishedAt = new Date(soldAt.getTime() - 4 * 7 * DAY)
      const parents = b.listings[0]

      const soldListing = await Listing.create({
        breederId: breeder._id,
        breed: breed._id,
        title: `${b.breedTitle} — ${genderNoun(sold.gender)} ${colorAdjective(sold.color, sold.gender)}`,
        description: SOLD_DESCRIPTIONS[index % SOLD_DESCRIPTIONS.length](sold.puppyName, sold.gender, sold.color),
        price: sold.price,
        currency: 'PLN',
        puppyName: sold.puppyName,
        birthDate: new Date(soldAt.getTime() - sold.ageWeeksAtSale * 7 * DAY),
        gender: sold.gender,
        color: sold.color,
        microchipNumber: nextChip(),
        hasPedigree: false,
        hasVetPassport: false,
        hasMetric: false,
        father: parents.father,
        mother: parents.mother,
        photos: rotated(photosOf(sold.photoKey), index + 1),
        status: 'sold',
        verificationStatus: 'verified',
        publishedAt,
        soldAt,
        location: { region: b.region, city: b.city },
        viewsCount: 120 + Math.floor(Math.random() * 260),
        inquiriesCount: 1,
        // В избранном проданных не держим: карточка каталога не показывает статус «продано»
        favoritesCount: 0,
        autoChecks: {
          microchipFormatValid: true,
          pedigreeFormatValid: true,
          documentsUploaded: true,
          dataConsistency: true,
          passedAt: publishedAt,
        },
      })
      await backdate(Listing, soldListing._id as Types.ObjectId, publishedAt)

      const thread = PURCHASE_THREADS[sold.threadVariant % PURCHASE_THREADS.length]({
        puppyName: sold.puppyName,
        gender: sold.gender,
      })
      const inquiry = await Inquiry.create({
        listingId: soldListing._id,
        buyerId: buyer._id,
        breederId: breeder._id,
        contactPhone: DEMO_BUYERS[sold.buyer].phone,
        messages: thread.map((m) => ({
          senderId: m.from === 'buyer' ? buyer._id : user._id,
          text: m.text,
          createdAt: new Date(soldAt.getTime() - m.daysBeforeSale * DAY),
        })),
        status: 'purchase_confirmed',
        purchaseConfirmedAt: soldAt,
        buyerUnreadCount: 0,
        breederUnreadCount: 0,
        lastMessageAt: soldAt,
      })
      const firstMessageAt = new Date(soldAt.getTime() - thread[0].daysBeforeSale * DAY)
      await backdate(Inquiry, inquiry._id as Types.ObjectId, firstMessageAt)

      const reviewAt = new Date(soldAt.getTime() + sold.reviewDaysAfterSale * DAY)
      const review = await Review.create({
        breederId: breeder._id,
        buyerId: buyer._id,
        inquiryId: inquiry._id,
        rating: sold.rating,
        text: sold.reviewText,
      })
      await backdate(Review, review._id as Types.ObjectId, reviewAt)
    }

    created.push({
      data: b,
      breederId: breeder._id as Types.ObjectId,
      userId: user._id as Types.ObjectId,
      activeListings,
    })
    // Считаем по факту: у заводчика могут быть объявления и из других сидов (ZKwP-кейсы)
    const activeCount = await Listing.countDocuments({
      breederId: breeder._id,
      status: 'active',
      verificationStatus: 'verified',
    })
    await Breeder.updateOne({ _id: breeder._id }, { listingsCount: activeCount })
    await recalculateRating(breeder._id as Types.ObjectId)
  }

  // Подтверждённая покупка основного тестового аккаунта — специально bez opinii,
  // żeby dało się przetestować formularz wystawiania opinii w UI
  const firstBreeder = created[0]
  const brunoInquiry = await Inquiry.create({
    listingId: firstBreeder.activeListings[0]._id,
    buyerId: buyers[0]._id,
    breederId: firstBreeder.breederId,
    contactPhone: DEMO_BUYERS[0].phone,
    messages: [
      {
        senderId: buyers[0]._id,
        text: 'Dzień dobry! Czy Bruno jest jeszcze dostępny? Mamy dom z ogrodem i dwójkę dzieci.',
        createdAt: daysAgo(14),
      },
      {
        senderId: firstBreeder.userId,
        text: 'Dzień dobry! Tak, Bruno czeka na nowy dom. Zapraszam do nas do hodowli, poznają Państwo rodziców szczeniaka.',
        createdAt: daysAgo(13),
      },
      {
        senderId: buyers[0]._id,
        text: 'Byliśmy w weekend — jesteśmy zachwyceni! Potwierdzam chęć zakupu.',
        createdAt: daysAgo(10),
      },
    ],
    status: 'purchase_confirmed',
    purchaseConfirmedAt: daysAgo(9),
    buyerUnreadCount: 0,
    breederUnreadCount: 0,
    lastMessageAt: daysAgo(10),
  })
  await backdate(Inquiry, brunoInquiry._id as Types.ObjectId, daysAgo(14))
  await Listing.updateOne({ _id: firstBreeder.activeListings[0]._id }, { $inc: { inquiriesCount: 1 } })

  // Живой диалог основного аккаунта со вторым заводчиком
  const secondBreeder = created[1]
  const nelaInquiry = await Inquiry.create({
    listingId: secondBreeder.activeListings[0]._id,
    buyerId: buyers[0]._id,
    breederId: secondBreeder.breederId,
    messages: [
      {
        senderId: buyers[0]._id,
        text: 'Dzień dobry, interesuje mnie szczeniak. Czy możliwy jest odbiór osobisty w przyszłym tygodniu?',
        createdAt: daysAgo(2),
      },
      {
        senderId: secondBreeder.userId,
        text: 'Dzień dobry! Oczywiście, zapraszam. Proszę o kontakt telefoniczny w celu umówienia wizyty.',
        createdAt: daysAgo(1),
      },
    ],
    status: 'in_progress',
    buyerUnreadCount: 1,
    breederUnreadCount: 0,
    lastMessageAt: daysAgo(1),
  })
  await backdate(Inquiry, nelaInquiry._id as Types.ObjectId, daysAgo(2))
  await Listing.updateOne({ _id: secondBreeder.activeListings[0]._id }, { $inc: { inquiriesCount: 1 } })

  // Остальные открытые переписки в разных статусах
  for (const open of OPEN_INQUIRIES) {
    const target = created[open.breeder]
    const listing = target.activeListings[open.listing]
    const buyer = buyers[open.buyer]
    const lastMessage = open.messages[open.messages.length - 1]
    const inquiry = await Inquiry.create({
      listingId: listing._id,
      buyerId: buyer._id,
      breederId: target.breederId,
      contactPhone: DEMO_BUYERS[open.buyer].phone,
      messages: open.messages.map((m) => ({
        senderId: m.from === 'buyer' ? buyer._id : target.userId,
        text: m.text,
        createdAt: daysAgo(m.daysAgo),
      })),
      status: open.status,
      buyerUnreadCount: open.buyerUnread,
      breederUnreadCount: open.breederUnread,
      lastMessageAt: daysAgo(lastMessage.daysAgo),
      closedAt: open.status === 'closed' ? daysAgo(lastMessage.daysAgo) : undefined,
    })
    await backdate(Inquiry, inquiry._id as Types.ObjectId, daysAgo(open.messages[0].daysAgo))
    await Listing.updateOne({ _id: listing._id }, { $inc: { inquiriesCount: 1 } })
  }

  // Избранное: 1–3 покупателя на каждое активное объявление
  const allActive = created.flatMap((c) => c.activeListings)
  let favoritesTotal = 0
  for (const [i, listing] of allActive.entries()) {
    const count = (i % 3) + 1
    for (let k = 0; k < count; k++) {
      const buyer = buyers[(i + k * 3) % buyers.length]
      await Favorite.create({ userId: buyer._id, listingId: listing._id })
    }
    await Listing.updateOne({ _id: listing._id }, { favoritesCount: count })
    favoritesTotal += count
  }

  const soldTotal = DEMO_BREEDERS.reduce((sum, b) => sum + b.soldHistory.length, 0)
  const inquiriesTotal = soldTotal + OPEN_INQUIRIES.length + 2

  console.log('')
  console.log(
    `Gotowe: ${DEMO_BREEDERS.length} hodowców (verified), ${allActive.length} aktywnych ogłoszeń, ` +
      `${soldTotal} sprzedanych, ${DEMO_BUYERS.length} kupujących, ${soldTotal} opinii, ` +
      `${inquiriesTotal} zapytań, ${favoritesTotal} pozycji w ulubionych.`
  )
  console.log('')
  console.log('Oceny hodowców:')
  for (const c of created) {
    const breeder = await Breeder.findById(c.breederId).select('kennelName rating reviewsCount')
    console.log(`  ${breeder?.kennelName}: ${breeder?.rating} (${breeder?.reviewsCount} opinii)`)
  }
  console.log('')
  console.log('Konta demo (hasło dla wszystkich: ' + DEMO_PASSWORD + '):')
  for (const b of DEMO_BREEDERS) console.log(`  ${b.kennelName}: ${b.email}`)
  for (const b of DEMO_BUYERS) console.log(`  Kupujący ${b.firstName} ${b.lastName}: ${b.email}`)
  console.log('  Admin: admin@pedigreehub.pl (hasło ustawiane przez `yarn create-admin [email] [hasło]`)')
  console.log('')
  console.log(
    `Uwaga: ${DEMO_BUYERS[0].email} ma potwierdzony zakup bez opinii — na jego koncie można przetestować formularz opinii.`
  )

  await mongoose.disconnect()
}

seedDemo().catch((error) => {
  console.error('Błąd seedowania danych demo:', error)
  process.exit(1)
})

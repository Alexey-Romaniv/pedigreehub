import 'dotenv/config'
import mongoose, { Types } from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env'
import { User } from '../modules/users/user.model'
import { Breeder } from '../modules/breeders/breeder.model'
import { Breed } from '../modules/breeds/breed.model'
import { Listing, type IListing } from '../modules/listings/listing.model'
import { Inquiry } from '../modules/inquiries/inquiry.model'
import { Review } from '../modules/reviews/review.model'
import { seedBreeds } from '../modules/breeds/breed.seed'
import { demoPhotos } from './demo-photos.generated'

/**
 * Демо-данные для защиты диплома: verified-заводчики с объявлениями,
 * покупатель, переписка (в т.ч. purchase_confirmed) и отзывы.
 * Запуск: yarn seed-demo. Идемпотентен: свои прежние данные пересоздаёт,
 * чужие (созданные руками/тестами) не трогает.
 */

const DEMO_PASSWORD = 'Demo1234'
// Все demo-микрочипы начинаются этим префиксом — по нему чистим свои объявления
const CHIP_PREFIX = '616000090'

/**
 * Настоящие фото нужной породы и окраса, залитые в наш Cloudinary
 * (`yarn upload-demo-photos`). Ключи — из demo-photos.source.json.
 */
const photosOf = (key: string): string[] => {
  const list = demoPhotos[key]
  if (!list?.length) throw new Error(`Brak zdjęć demo dla klucza: ${key}`)
  return list
}

const DEMO_BREEDERS = [
  {
    email: 'hodowla.zlotalapa@demo.pedigreehub.pl',
    firstName: 'Katarzyna',
    lastName: 'Nowak',
    phone: '+48601100101',
    kennelName: 'Hodowla Złota Łapa',
    kennelRegistration: 'ZKwP-DEMO-001',
    kennelPhotoKey: 'kennel-zlota-lapa',
    region: 'mazowieckie',
    city: 'Warszawa',
    description:
      'Rodzinna hodowla labradorów z wieloletnim doświadczeniem. Nasze psy wychowują się w domu, wśród dzieci. Wszystkie szczenięta odchowywane zgodnie z wymogami ZKwP, z rodowodami i pełną dokumentacją weterynaryjną.',
    breedName: 'Labrador Retriever',
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
  },
  {
    email: 'hodowla.poddebem@demo.pedigreehub.pl',
    firstName: 'Marek',
    lastName: 'Wiśniewski',
    phone: '+48601100102',
    kennelName: 'Hodowla Pod Dębem',
    kennelRegistration: 'ZKwP-DEMO-002',
    kennelPhotoKey: 'kennel-pod-debem',
    region: 'małopolskie',
    city: 'Kraków',
    description:
      'Kameralna hodowla golden retrieverów pod Krakowem. Stawiamy na zdrowie i temperament — wszystkie psy hodowlane z badaniami HD/ED i testami genetycznymi. Szczenięta odchowywane w domu z pełną socjalizacją.',
    breedName: 'Golden Retriever',
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
  },
  {
    email: 'hodowla.krolewskasfora@demo.pedigreehub.pl',
    firstName: 'Agnieszka',
    lastName: 'Kowalczyk',
    phone: '+48601100103',
    kennelName: 'Hodowla Królewska Sfora',
    kennelRegistration: 'ZKwP-DEMO-003',
    kennelPhotoKey: 'kennel-krolewska-sfora',
    region: 'wielkopolskie',
    city: 'Poznań',
    description:
      'Hodowla owczarków niemieckich z linii wystawowych. Ponad 15 lat doświadczenia, liczne tytuły championskie. Szczenięta po rodzicach z licencjami hodowlanymi ZKwP, z pełną dokumentacją i wsparciem hodowcy na całe życie psa.',
    breedName: 'Owczarek Niemiecki',
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
  },
]

const DEMO_BUYER = {
  email: 'kupujacy.demo@pedigreehub.pl',
  firstName: 'Piotr',
  lastName: 'Zieliński',
  phone: '+48601100200',
}

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

async function seedDemo() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Seeding danych demo...')

  await seedBreeds()

  // Чистим свои прежние demo-сущности (по known email'ам и chip-префиксу)
  const demoEmails = [...DEMO_BREEDERS.map((b) => b.email), DEMO_BUYER.email]
  const oldUsers = await User.find({ email: { $in: demoEmails } })
  const oldUserIds = oldUsers.map((u) => u._id)
  const oldBreeders = await Breeder.find({ userId: { $in: oldUserIds } })
  const oldBreederIds = oldBreeders.map((b) => b._id)
  await Review.deleteMany({ $or: [{ buyerId: { $in: oldUserIds } }, { breederId: { $in: oldBreederIds } }] })
  await Inquiry.deleteMany({ $or: [{ buyerId: { $in: oldUserIds } }, { breederId: { $in: oldBreederIds } }] })
  await Listing.deleteMany({ microchipNumber: { $regex: `^${CHIP_PREFIX}` } })

  const buyer = await upsertUser({ ...DEMO_BUYER, role: 'user' })

  let chipCounter = 0
  const createdListings: { listing: IListing; breederId: Types.ObjectId; breederUserId: Types.ObjectId }[] = []

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
      nipVerified: true,
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

    for (const l of b.listings) {
      chipCounter += 1
      const birthDate = new Date(Date.now() - l.weeksOld * 7 * 24 * 60 * 60 * 1000)
      const listing = await Listing.create({
        breederId: breeder._id,
        breed: breed._id,
        title: l.title,
        description: l.description,
        price: l.price,
        currency: 'PLN',
        puppyName: l.puppyName,
        birthDate,
        gender: l.gender,
        color: l.color,
        microchipNumber: `${CHIP_PREFIX}${String(chipCounter).padStart(6, '0')}`,
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
        favoritesCount: Math.floor(Math.random() * 8),
        autoChecks: {
          microchipFormatValid: true,
          pedigreeFormatValid: true,
          documentsUploaded: true,
          dataConsistency: true,
          passedAt: new Date(),
        },
      })
      createdListings.push({ listing, breederId: breeder._id, breederUserId: user._id })
    }

    await Breeder.updateOne({ _id: breeder._id }, { listingsCount: b.listings.length })
  }

  // Переписка 1: подтверждённая покупка у первого заводчика → отзыв
  const first = createdListings[0]
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
  const confirmedInquiry = await Inquiry.create({
    listingId: first.listing._id,
    buyerId: buyer._id,
    breederId: first.breederId,
    contactPhone: DEMO_BUYER.phone,
    messages: [
      { senderId: buyer._id, text: 'Dzień dobry! Czy Bruno jest jeszcze dostępny? Mamy dom z ogrodem i dwójkę dzieci.', createdAt: daysAgo(14) },
      { senderId: first.breederUserId, text: 'Dzień dobry! Tak, Bruno czeka na nowy dom. Zapraszam do nas do hodowli, poznają Państwo rodziców szczeniaka.', createdAt: daysAgo(13) },
      { senderId: buyer._id, text: 'Byliśmy w weekend — jesteśmy zachwyceni! Potwierdzam chęć zakupu.', createdAt: daysAgo(10) },
    ],
    status: 'purchase_confirmed',
    purchaseConfirmedAt: daysAgo(9),
    buyerUnreadCount: 0,
    breederUnreadCount: 0,
    lastMessageAt: daysAgo(10),
  })
  await Listing.updateOne({ _id: first.listing._id }, { $inc: { inquiriesCount: 1 } })

  await Review.create({
    breederId: first.breederId,
    buyerId: buyer._id,
    inquiryId: confirmedInquiry._id,
    rating: 5,
    text: 'Fantastyczna hodowla! Bruno jest zdrowy, wesoły i świetnie zsocjalizowany. Pani Katarzyna służyła pomocą na każdym etapie. Gorąco polecam!',
  })

  // Пересчёт рейтинга заводчика по отзывам (как в review.service)
  const agg = await Review.aggregate([
    { $match: { breederId: first.breederId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await Breeder.updateOne(
    { _id: first.breederId },
    { rating: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0, reviewsCount: agg[0]?.count ?? 0 }
  )

  // Переписка 2: активный диалог со вторым заводчиком
  const second = createdListings.find((c) => !c.breederId.equals(first.breederId))
  if (second) {
    await Inquiry.create({
      listingId: second.listing._id,
      buyerId: buyer._id,
      breederId: second.breederId,
      messages: [
        { senderId: buyer._id, text: 'Dzień dobry, interesuje mnie szczeniak. Czy możliwy jest odbiór osobisty w przyszłym tygodniu?', createdAt: daysAgo(2) },
        { senderId: second.breederUserId, text: 'Dzień dobry! Oczywiście, zapraszam. Proszę o kontakt telefoniczny w celu umówienia wizyty.', createdAt: daysAgo(1) },
      ],
      status: 'in_progress',
      buyerUnreadCount: 1,
      breederUnreadCount: 0,
      lastMessageAt: daysAgo(1),
    })
    await Listing.updateOne({ _id: second.listing._id }, { $inc: { inquiriesCount: 1 } })
  }

  const total = createdListings.length
  console.log('')
  console.log(`Gotowe: ${DEMO_BREEDERS.length} hodowców (verified), ${total} ogłoszeń (active+verified), 2 zapytania, 1 opinia.`)
  console.log('')
  console.log('Konta demo (hasło dla wszystkich: ' + DEMO_PASSWORD + '):')
  for (const b of DEMO_BREEDERS) console.log(`  ${b.kennelName}: ${b.email}`)
  console.log(`  Kupujący: ${DEMO_BUYER.email}`)
  console.log('  Admin: admin@pedigreehub.pl (hasło ustawiane przez `yarn create-admin [email] [hasło]`)')

  await mongoose.disconnect()
}

seedDemo().catch((error) => {
  console.error('Błąd seedowania danych demo:', error)
  process.exit(1)
})

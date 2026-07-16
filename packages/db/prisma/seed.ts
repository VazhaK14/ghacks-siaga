import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";

import {
  CommunicationChannel,
  DispatchAgencyAvailability,
  DispatchAgencyType,
  type DispatchAgencyType as DispatchAgencyTypeValue,
  HandlingMode,
  IncidentType,
  type IncidentType as IncidentTypeValue,
  MessageSenderType,
  ReportCategory,
  type ReportCategory as ReportCategoryValue,
  ReportStatus,
  type ReportStatus as ReportStatusValue,
  UserRole,
} from "./generated/enums";

dotenv.config({ path: "../../apps/server/.env" });

const { createPrismaClient } = await import("../src/index");

const MINUTE_MS = 60_000;
const OPERATOR_EMAIL = "operator@siaga.app";
const OPERATOR_PASSWORD = "Siaga-Operator-2026!";
const OPERATOR_NAME = "Default Operator";
const DEMO_REPORTER_EMAIL = "reporter.demo@siaga.app";
const DEMO_REPORTER_ID = "demo-reporter-siaga";

interface DemoAgencySeed {
  address: string;
  availability: (typeof DispatchAgencyAvailability)[keyof typeof DispatchAgencyAvailability];
  contactPhone: string;
  id: string;
  jurisdiction: string;
  latitude: number;
  longitude: number;
  name: string;
  type: DispatchAgencyTypeValue;
}

interface DemoReportSeed {
  address: string;
  category: ReportCategoryValue;
  incidentType: IncidentTypeValue;
  latitude: number;
  longitude: number;
  minutesAgo: number;
  recommendation: string;
  status: ReportStatusValue;
  summary: string;
  title: string;
}

const DEMO_AGENCIES: DemoAgencySeed[] = [
  {
    address: "Jl. Medan Merdeka Timur, Gambir, Jakarta Pusat",
    availability: DispatchAgencyAvailability.AVAILABLE,
    contactPhone: "110",
    id: "demo-agency-police-gambir",
    jurisdiction: "Jakarta Pusat",
    latitude: -6.1768,
    longitude: 106.8307,
    name: "Polsek Metro Gambir",
    type: DispatchAgencyType.POLICE,
  },
  {
    address: "Jl. Sutan Syahrir, Menteng, Jakarta Pusat",
    availability: DispatchAgencyAvailability.BUSY,
    contactPhone: "110",
    id: "demo-agency-police-menteng",
    jurisdiction: "Jakarta Pusat",
    latitude: -6.2021,
    longitude: 106.8373,
    name: "Polsek Metro Menteng",
    type: DispatchAgencyType.POLICE,
  },
  {
    address: "Jl. Trunojoyo, Kebayoran Baru, Jakarta Selatan",
    availability: DispatchAgencyAvailability.AVAILABLE,
    contactPhone: "110",
    id: "demo-agency-police-kebayoran",
    jurisdiction: "Jakarta Selatan",
    latitude: -6.2388,
    longitude: 106.8008,
    name: "Polres Metro Jakarta Selatan",
    type: DispatchAgencyType.POLICE,
  },
  {
    address: "Jl. Karet Pasar Baru Barat, Tanah Abang",
    availability: DispatchAgencyAvailability.AVAILABLE,
    contactPhone: "119",
    id: "demo-agency-ambulance-tanah-abang",
    jurisdiction: "Jakarta Pusat",
    latitude: -6.2071,
    longitude: 106.8134,
    name: "Ambulans PSC Tanah Abang",
    type: DispatchAgencyType.AMBULANCE,
  },
  {
    address: "Jl. Salemba Raya, Senen, Jakarta Pusat",
    availability: DispatchAgencyAvailability.BUSY,
    contactPhone: "119",
    id: "demo-agency-ambulance-salemba",
    jurisdiction: "Jakarta Pusat",
    latitude: -6.178,
    longitude: 106.8488,
    name: "Ambulans PSC Salemba",
    type: DispatchAgencyType.AMBULANCE,
  },
  {
    address: "Jl. H.R. Rasuna Said, Setiabudi",
    availability: DispatchAgencyAvailability.AVAILABLE,
    contactPhone: "119",
    id: "demo-agency-ambulance-setiabudi",
    jurisdiction: "Jakarta Selatan",
    latitude: -6.2186,
    longitude: 106.8342,
    name: "Ambulans PSC Setiabudi",
    type: DispatchAgencyType.AMBULANCE,
  },
  {
    address: "Jl. K.H. Zainul Arifin, Gambir",
    availability: DispatchAgencyAvailability.AVAILABLE,
    contactPhone: "113",
    id: "demo-agency-fire-gambir",
    jurisdiction: "Jakarta Pusat",
    latitude: -6.1647,
    longitude: 106.8174,
    name: "Pos Pemadam Gambir",
    type: DispatchAgencyType.FIRE_DEPARTMENT,
  },
  {
    address: "Jl. Taman Sari Raya, Jakarta Barat",
    availability: DispatchAgencyAvailability.BUSY,
    contactPhone: "113",
    id: "demo-agency-fire-taman-sari",
    jurisdiction: "Jakarta Barat",
    latitude: -6.1483,
    longitude: 106.818,
    name: "Sektor Pemadam Taman Sari",
    type: DispatchAgencyType.FIRE_DEPARTMENT,
  },
  {
    address: "Jl. Aipda K.S. Tubun, Palmerah",
    availability: DispatchAgencyAvailability.AVAILABLE,
    contactPhone: "115",
    id: "demo-agency-sar-palmerah",
    jurisdiction: "DKI Jakarta",
    latitude: -6.1941,
    longitude: 106.7984,
    name: "Unit Siaga SAR Jakarta",
    type: DispatchAgencyType.SAR,
  },
  {
    address: "Tanjung Priok, Jakarta Utara",
    availability: DispatchAgencyAvailability.OFFLINE,
    contactPhone: "115",
    id: "demo-agency-sar-tanjung-priok",
    jurisdiction: "Jakarta Utara",
    latitude: -6.1084,
    longitude: 106.8806,
    name: "Pos SAR Tanjung Priok",
    type: DispatchAgencyType.SAR,
  },
];

const DEMO_REPORTS: DemoReportSeed[] = [
  {
    address: "Jl. M.H. Thamrin, Menteng, Jakarta Pusat",
    category: ReportCategory.CRITICAL,
    incidentType: IncidentType.CRIME,
    latitude: -6.1944,
    longitude: 106.8229,
    minutesAgo: 2,
    recommendation:
      "Jaga jarak aman, jangan menghadapi pelaku, dan tunggu unit kepolisian.",
    status: ReportStatus.READY_FOR_REVIEW,
    summary:
      "Pelapor melihat pria membawa pisau mengancam pengunjung minimarket.",
    title: "Ancaman senjata tajam di minimarket",
  },
  {
    address: "Jl. Jenderal Sudirman, Setiabudi, Jakarta Selatan",
    category: ReportCategory.CRITICAL,
    incidentType: IncidentType.MEDICAL,
    latitude: -6.2146,
    longitude: 106.8188,
    minutesAgo: 5,
    recommendation:
      "Kirim ambulans dan minta pelapor memantau pernapasan korban.",
    status: ReportStatus.DISPATCH_PENDING,
    summary:
      "Seorang pejalan kaki tidak sadarkan diri dan sulit bernapas di trotoar.",
    title: "Korban tidak sadarkan diri",
  },
  {
    address: "Jl. Kyai Tapa, Grogol Petamburan, Jakarta Barat",
    category: ReportCategory.HIGH,
    incidentType: IncidentType.FIRE,
    latitude: -6.1668,
    longitude: 106.7904,
    minutesAgo: 7,
    recommendation: "Evakuasi penghuni lantai terdekat dan kirim unit pemadam.",
    status: ReportStatus.DISPATCHED,
    summary: "Asap tebal keluar dari panel listrik lantai dua sebuah ruko.",
    title: "Asap dari panel listrik ruko",
  },
  {
    address: "Jl. Gatot Subroto, Mampang Prapatan, Jakarta Selatan",
    category: ReportCategory.HIGH,
    incidentType: IncidentType.TRAFFIC_ACCIDENT,
    latitude: -6.2383,
    longitude: 106.8236,
    minutesAgo: 11,
    recommendation:
      "Amankan lajur, kirim ambulans, dan koordinasikan pengaturan lalu lintas.",
    status: ReportStatus.HELP_EN_ROUTE,
    summary:
      "Tabrakan motor dan mobil menyebabkan satu pengendara terluka di bahu jalan.",
    title: "Kecelakaan motor dan mobil",
  },
  {
    address: "Jl. Matraman Raya, Matraman, Jakarta Timur",
    category: ReportCategory.HIGH,
    incidentType: IncidentType.DOMESTIC_VIOLENCE,
    latitude: -6.2015,
    longitude: 106.8575,
    minutesAgo: 14,
    recommendation:
      "Kirim petugas terlatih dan jangan meminta pelapor menghadapi pelaku.",
    status: ReportStatus.READY_FOR_REVIEW,
    summary:
      "Pelapor mendengar teriakan dan benturan dari unit apartemen tetangga.",
    title: "Dugaan kekerasan dalam rumah tangga",
  },
  {
    address: "Jl. Danau Sunter Utara, Tanjung Priok, Jakarta Utara",
    category: ReportCategory.MEDIUM,
    incidentType: IncidentType.MISSING_PERSON,
    latitude: -6.1376,
    longitude: 106.8661,
    minutesAgo: 18,
    recommendation:
      "Kumpulkan ciri terakhir dan koordinasikan pencarian area sekitar danau.",
    status: ReportStatus.AI_GATHERING,
    summary:
      "Anak berusia delapan tahun terpisah dari keluarga saat berada di taman.",
    title: "Anak terpisah dari keluarga",
  },
  {
    address: "Jl. Salemba Raya, Senen, Jakarta Pusat",
    category: ReportCategory.MEDIUM,
    incidentType: IncidentType.MEDICAL,
    latitude: -6.1783,
    longitude: 106.8478,
    minutesAgo: 21,
    recommendation: "Berikan ruang bernapas dan siapkan pemeriksaan medis.",
    status: ReportStatus.SUBMITTED,
    summary: "Penumpang bus mengalami pusing berat dan hampir pingsan.",
    title: "Penumpang bus hampir pingsan",
  },
  {
    address: "Jl. Kemang Raya, Mampang Prapatan, Jakarta Selatan",
    category: ReportCategory.MEDIUM,
    incidentType: IncidentType.CRIME,
    latitude: -6.2615,
    longitude: 106.8136,
    minutesAgo: 26,
    recommendation:
      "Catat arah kendaraan dan teruskan informasi kepada unit kepolisian.",
    status: ReportStatus.READY_FOR_REVIEW,
    summary: "Tas pelapor dirampas pengendara motor yang melaju ke arah utara.",
    title: "Perampasan tas oleh pengendara motor",
  },
  {
    address: "Jl. Pemuda, Pulo Gadung, Jakarta Timur",
    category: ReportCategory.LOW,
    incidentType: IncidentType.FIRE,
    latitude: -6.1904,
    longitude: 106.8919,
    minutesAgo: 31,
    recommendation:
      "Pastikan api benar-benar padam dan jauhkan material mudah terbakar.",
    status: ReportStatus.HELP_ARRIVED,
    summary:
      "Api kecil pada tumpukan kardus telah dipadamkan petugas keamanan.",
    title: "Api kecil pada tumpukan kardus",
  },
  {
    address: "Jl. Panjang, Kebon Jeruk, Jakarta Barat",
    category: ReportCategory.LOW,
    incidentType: IncidentType.TRAFFIC_ACCIDENT,
    latitude: -6.1917,
    longitude: 106.7676,
    minutesAgo: 38,
    recommendation:
      "Pindahkan kendaraan bila aman dan dokumentasikan kerusakan.",
    status: ReportStatus.DISPATCHED,
    summary:
      "Dua kendaraan bersenggolan tanpa korban luka dan menutup sebagian lajur.",
    title: "Senggolan kendaraan tanpa korban",
  },
  {
    address: "Jl. Cempaka Putih Raya, Jakarta Pusat",
    category: ReportCategory.UNCATEGORIZED,
    incidentType: IncidentType.OTHER,
    latitude: -6.1811,
    longitude: 106.8682,
    minutesAgo: 42,
    recommendation: "Hubungi pelapor untuk memastikan jenis kebutuhan bantuan.",
    status: ReportStatus.AI_GATHERING,
    summary:
      "Pelapor mengirim lokasi dan meminta bantuan tanpa menjelaskan kondisi.",
    title: "Permintaan bantuan belum terklasifikasi",
  },
  {
    address: "Jl. Pluit Selatan Raya, Penjaringan, Jakarta Utara",
    category: ReportCategory.HIGH,
    incidentType: IncidentType.NATURAL_DISASTER,
    latitude: -6.1237,
    longitude: 106.7908,
    minutesAgo: 48,
    recommendation: "Pantau kenaikan air dan siapkan evakuasi warga rentan.",
    status: ReportStatus.READY_FOR_REVIEW,
    summary:
      "Genangan meningkat cepat dan mulai memasuki rumah warga di satu blok.",
    title: "Genangan meningkat di permukiman",
  },
  {
    address: "Jl. Daan Mogot, Cengkareng, Jakarta Barat",
    category: ReportCategory.MEDIUM,
    incidentType: IncidentType.TRAFFIC_ACCIDENT,
    latitude: -6.1548,
    longitude: 106.7336,
    minutesAgo: 55,
    recommendation: "Laporan selesai dan tidak memerlukan tindakan lanjutan.",
    status: ReportStatus.RESOLVED,
    summary:
      "Kendaraan mogok telah dipindahkan dan arus lalu lintas kembali normal.",
    title: "Kendaraan mogok selesai ditangani",
  },
  {
    address: "Jl. Raya Bogor, Ciracas, Jakarta Timur",
    category: ReportCategory.LOW,
    incidentType: IncidentType.OTHER,
    latitude: -6.3168,
    longitude: 106.8684,
    minutesAgo: 63,
    recommendation: "Tidak ada respons lanjutan karena laporan dibatalkan.",
    status: ReportStatus.CANCELLED,
    summary: "Pelapor membatalkan permintaan setelah memastikan kondisi aman.",
    title: "Laporan dibatalkan pelapor",
  },
  {
    address: "Lokasi belum tersedia",
    category: ReportCategory.MEDIUM,
    incidentType: IncidentType.MEDICAL,
    latitude: -6.2088,
    longitude: 106.8456,
    minutesAgo: 68,
    recommendation:
      "Konfirmasi ulang titik kejadian sebelum unit diberangkatkan.",
    status: ReportStatus.SUBMITTED,
    summary:
      "Pelapor menyampaikan cedera ringan tetapi akurasi lokasi masih rendah.",
    title: "Lokasi kejadian perlu dikonfirmasi",
  },
];

const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * MINUTE_MS);

async function seedOperator() {
  const prisma = createPrismaClient();
  const existingOperator = await prisma.user.findUnique({
    where: { email: OPERATOR_EMAIL },
  });

  if (!existingOperator) {
    const hashedPassword = await hashPassword(OPERATOR_PASSWORD);
    const userId = randomUUID();

    await prisma.user.create({
      data: {
        accounts: {
          create: {
            accountId: userId,
            id: randomUUID(),
            password: hashedPassword,
            providerId: "credential",
          },
        },
        email: OPERATOR_EMAIL,
        emailVerified: true,
        id: userId,
        name: OPERATOR_NAME,
        role: UserRole.OPERATOR,
      },
    });
  }

  await prisma.$disconnect();
}

async function seedDemoReports() {
  const prisma = createPrismaClient();

  const reporter = await prisma.user.upsert({
    create: {
      email: DEMO_REPORTER_EMAIL,
      emailVerified: true,
      id: DEMO_REPORTER_ID,
      name: "Rani Pratama",
      role: UserRole.REPORTER,
    },
    update: {
      name: "Rani Pratama",
      role: UserRole.REPORTER,
    },
    where: { email: DEMO_REPORTER_EMAIL },
  });

  await prisma.reporterProfile.upsert({
    create: {
      emergencyContactName: "Dimas Pratama",
      emergencyContactPhone: "+6281211112222",
      homeAddress: "Jakarta",
      phoneNumber: "+6281298765432",
      userId: reporter.id,
    },
    update: {
      emergencyContactName: "Dimas Pratama",
      emergencyContactPhone: "+6281211112222",
      phoneNumber: "+6281298765432",
    },
    where: { userId: reporter.id },
  });

  await prisma.emergencyReport.deleteMany({
    where: { isDemo: true },
  });

  const createDemoReport = async (
    report: DemoReportSeed,
    index: number
  ): Promise<void> => {
    const createdAt = minutesAgo(report.minutesAgo);
    const reportId = `demo-report-${String(index + 1).padStart(3, "0")}`;
    const statusHistory =
      report.status === ReportStatus.SUBMITTED
        ? [
            {
              actorType: MessageSenderType.REPORTER,
              createdAt,
              fromStatus: null,
              note: "Laporan demo diterima",
              toStatus: ReportStatus.SUBMITTED,
            },
          ]
        : [
            {
              actorType: MessageSenderType.REPORTER,
              createdAt,
              fromStatus: null,
              note: "Laporan demo diterima",
              toStatus: ReportStatus.SUBMITTED,
            },
            {
              actorType: MessageSenderType.AI_AGENT,
              createdAt: new Date(createdAt.getTime() + MINUTE_MS),
              fromStatus: ReportStatus.SUBMITTED,
              note: "Klasifikasi awal laporan demo selesai",
              toStatus: report.status,
            },
          ];

    await prisma.emergencyReport.create({
      data: {
        accessToken: `demo-access-${String(index + 1).padStart(3, "0")}`,
        activeChannel: CommunicationChannel.CHAT,
        address:
          report.title === "Lokasi kejadian perlu dikonfirmasi"
            ? null
            : report.address,
        aiAnalyses: {
          create: {
            category: report.category,
            confidenceScore:
              report.category === ReportCategory.UNCATEGORIZED ? 0.42 : 0.91,
            createdAt: new Date(createdAt.getTime() + MINUTE_MS),
            incidentType: report.incidentType,
            modelVersion: "demo-analysis-v1",
            recommendation: report.recommendation,
            summary: report.summary,
          },
        },
        category: report.category,
        contactPhoneSnapshot: "+6281298765432",
        createdAt,
        extractedData: {
          demo: true,
          peopleAtRisk: report.category === ReportCategory.CRITICAL ? 2 : 1,
          source: "seed",
        },
        handlingMode: HandlingMode.AI,
        id: reportId,
        incidentType: report.incidentType,
        isDemo: true,
        latitude:
          report.title === "Lokasi kejadian perlu dikonfirmasi"
            ? null
            : report.latitude,
        longitude:
          report.title === "Lokasi kejadian perlu dikonfirmasi"
            ? null
            : report.longitude,
        recommendation: report.recommendation,
        reporterId: reporter.id,
        status: report.status,
        statusHistory: {
          create: statusHistory,
        },
        summary: report.summary,
        title: report.title,
        updatedAt: new Date(createdAt.getTime() + MINUTE_MS),
      },
    });
  };

  await Promise.all(DEMO_REPORTS.map(createDemoReport));

  await prisma.$disconnect();
}

async function seedDispatchAgencies() {
  const prisma = createPrismaClient();

  await Promise.all(
    DEMO_AGENCIES.map((agency) =>
      prisma.dispatchAgency.upsert({
        create: agency,
        update: agency,
        where: { id: agency.id },
      })
    )
  );

  await prisma.$disconnect();
}

async function main() {
  await seedOperator();
  await seedDemoReports();
  await seedDispatchAgencies();
}

main().catch((error: unknown) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});

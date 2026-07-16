# SIAGA — Handoff: Pivot Aplikasi Warga ke PWA (`apps/citizen`)

Dokumen ini untuk melanjutkan pekerjaan di Codex (atau agen lain). Berisi:
status saat ini, apa yang sudah selesai, dan langkah berikutnya yang konkret.

## Rencana lengkap (source of truth)

File plan penuh ada di:

```
/home/vazha/.claude/plans/jadi-ui-yang-di-merry-lagoon.md
```

Baca itu dulu untuk konteks & justifikasi. Dokumen ini adalah ringkasan
eksekusi + status.

## Git state

- Branch: **`feat/pwa-implementation`**
- Commit **`1dbe410`** = hasil rombak RN yang sudah diarsipkan (SOS UI +
  on-device STT). **Kode logika murni yang mau di-reuse ada di sini** —
  ambil via `git show 1dbe410:apps/native/<path>`.
- **Working tree BELUM di-commit**: penghapusan `apps/native` + `apps/docs`,
  scrub config, dan seluruh scaffold `apps/citizen` masih uncommitted
  (commit penghapusan sempat diblokir classifier — aman, tinggal di-commit
  manual saat siap). Semua reversible karena `1dbe410` menyimpan RN.

## Konteks singkat

Aplikasi warga dulu Expo RN (`apps/native`) — susah dites (butuh dev-client
build tiap iterasi). Pivot ke **PWA** (`apps/citizen`, React Router v8 **SPA**)
karena mic/GPS/notif semua bisa via browser HP. Backend (`packages/api`),
design system (`packages/ui`), auth (better-auth, role REPORTER default), dan
tRPC **dipakai ulang tanpa perubahan**.

**Caveat jujur** (penting saat demo):
- STT: Web Speech API hanya Android/Chrome. iOS Safari tidak dukung → fallback ketik.
- Push: iOS butuh "Add to Home Screen" (16.4+). Android penuh.
- Tes di HP nyata butuh HTTPS (mic/GPS/SW) → Vercel preview atau tunnel.

## Status akhir — 17 Juli 2026

Seluruh scope Fase 0–4 sudah diimplementasikan. `apps/citizen` kini mencakup
auth REPORTER, profil darurat, shell mobile, alur SOS teks/suara/senyap,
pelacakan status, geolocation, PWA install/offline shell, dan web push. Backend
memiliki penyimpanan subscription Prisma, endpoint tRPC, pengiriman VAPID, dan
cleanup subscription kedaluwarsa. Service `citizen` beserta rewrite `/citizen`
juga sudah ditambahkan ke konfigurasi Vercel.

Verifikasi otomatis terakhir dari root semuanya hijau:

```bash
bun run check-types
bun x ultracite check
bun run build
bun run db:migrate
```

Build PWA menghasilkan `build/client/service-worker.js` dengan 65 entri
precache (sekitar 895 KiB). Smoke test artefak produksi juga menghasilkan HTTP
200 untuk root server, `trpc/healthCheck`, halaman citizen, service worker, dan
web manifest. Uji penerimaan lintas perangkat tetap dilakukan setelah deploy
HTTPS karena izin mic, GPS, service worker, dan push bergantung pada
browser/perangkat serta environment eksternal.

## ✅ SELESAI

### Fase 0 — Hapus native+docs + scrub config
- Dihapus: `apps/native/`, `apps/docs/`.
- `package.json` (root): script `dev:native` → `dev:citizen`; entri catalog
  `@better-auth/expo` dibuang.
- `packages/auth/src/index.ts`: plugin `expo()` + import + trustedOrigins
  `siaga-app://`/`exp://` dibuang.
- `packages/auth/package.json`: dep `@better-auth/expo` dibuang.
- `packages/env/`: `src/native.ts` dihapus + export `./native` dibuang.
- **Validasi hijau**: `bun install`, `bun run check-types`, `bun run check`,
  `bun run build` semua lolos tanpa native/docs.

### Fase 1 — Scaffold `apps/citizen` (SPA) + koneksi backend
Sudah dibuat & tervalidasi (typecheck + `bun run build` SPA sukses, dev
server serve HTTP 200 di `http://localhost:5176`):
- Config: `package.json` (name `citizen`), `vite.config.ts` (dev port **5176**,
  sudah masuk `CORS_ORIGIN` server jadi tanpa edit server .env), 
  `react-router.config.ts` (**`ssr: false`**), `tsconfig.json`, `components.json`,
  `.gitignore`, `.env` + `.env.example` (`VITE_SERVER_URL=http://localhost:3000`).
- Infra klien (disalin dari `apps/web`, sudah cross-origin `credentials:include`):
  `src/utils/trpc.ts`, `src/lib/auth-client.ts`, `src/lib/get-server-url.ts`.
- Shell: `src/root.tsx` (default tema light/warm, font Plus Jakarta Sans,
  QueryClientProvider, Toaster), `src/routes.ts` (flatRoutes), `src/index.css`
  (`@import "@siaga-app/ui/globals.css"`).
- Placeholder awal `src/routes/_index.tsx` sudah diganti oleh shell dan halaman
  beranda citizen yang lengkap.

Tambahan deployment Fase 1 juga sudah selesai: service `citizen` dan rewrite
`/citizen` sudah tersedia di root `vercel.json`.

## ✅ IMPLEMENTASI LANJUTAN SELESAI

### Fase 2 — Auth + profil + shell
Sudah diimplementasikan berdasarkan referensi RN:
1. **Reporter guard** (client-side): `authClient.useSession()` →
   redirect `/sign-in` bila tak ada sesi, tolak bila `role !== "REPORTER"`.
   Ref: `1dbe410:apps/native/features/auth/guards.tsx`.
2. **Sign-in / Sign-up**: `authClient.signIn.email` / `signUp.email`
   (signup default REPORTER). Ref: `1dbe410:apps/native/features/auth/`.
3. **Profil darurat**: field + validasi → mutation `profile.get`/`profile.update`
   (sudah ada di backend). Ref:
   `1dbe410:apps/native/features/profile/components/profile-screen.tsx` +
   `validation.ts`. Pakai komponen `@siaga-app/ui` (`field`, `input`, `button`).
4. **Shell + bottom nav** (Home/Riwayat/Profil) pakai `@siaga-app/ui`.

### Fase 3 — Alur SOS inti
**Logika murni sudah diadaptasi** (import `trpc` diarahkan ke `@/utils/trpc`):
- `derive-phase.ts` (100% pure), `context.tsx`, `content.ts`,
  `api.ts` (hooks tRPC), `use-report-phase-navigation.ts`.
  Semua ada di `1dbe410:apps/native/features/emergency/`.
- `status-content.ts` — pakai label/warna, ikon ganti ke `lucide-react`
  (jangan Ionicons). Ada juga di `apps/web/src/features/map/content.ts` +
  `dispatch/content.ts` (boleh konsolidasi).

**Adaptasi browser sudah selesai** dengan kontrak yang sama:
- `src/lib/use-current-location.ts`: `navigator.geolocation.getCurrentPosition`
  + `watchPosition`. Tipe `LocationStatus` (`denied/disabled/error/locating/ready`)
  & callback `onLocationResolved` sama. Reverse-geocode dilewati (kirim koordinat).
  Ref kontrak: `1dbe410:apps/native/features/location/use-current-location.ts`.
- `src/lib/use-voice-transcription.ts`: `window.SpeechRecognition ??
  window.webkitSpeechRecognition`, `lang:"id-ID"`, continuous+interim,
  restart-on-end; kontrak `{enabled,onFinalResult} → {interimText,status}`
  status `idle/listening/unavailable`; `unavailable` → fallback ketik.
  Ref kontrak: `1dbe410:apps/native/features/emergency/use-voice-transcription.ts`.
- TTS: `window.speechSynthesis.speak(...)` (ganti `expo-speech`).

**Layar DOM/web sudah dibangun** (state-machine & urutan mutation SAMA PERSIS
dari `1dbe410:apps/native/features/emergency/components/incident-screens.tsx`):
- SOS (chip kategori + tombol besar), report-mode, connecting, chat
  (pakai `message`/`bubble`/`message-scroller` dari ui-kit), silent,
  dispatch+arrival (komponen `DispatchTimeline`, ref
  `1dbe410:apps/native/features/emergency/components/dispatch-timeline.tsx`),
  complete.
- Urutan mutation: `create` → route by mode → `appendReporterText` (teks/STT) →
  `switchMode` → `endSession` → `acknowledge` (`HELP_VISIBLE`/`WITH_RESPONDER`);
  navigasi didorong `deriveReportPhase(report.status)`.
- **Status tracking = polling** (`refetchInterval` 2s/5s), tanpa SSE pass ini.

**Packaging PWA selesai**: `vite-plugin-pwa`, manifest SIAGA standalone, ikon
regular+maskable, registrasi update otomatis, dan custom service worker untuk
precache shell, push, serta notification click.

### Fase 4 — Push notification
Selesai:

- model dan migration Prisma `PushSubscription` beserta relasi user;
- procedure REPORTER untuk public key, simpan, dan hapus subscription;
- konfigurasi `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, dan `VAPID_SUBJECT`;
- pengiriman `web-push` dari event perubahan status/dispatch tanpa membuat
  kegagalan push menggagalkan mutasi utama;
- penghapusan otomatis endpoint yang merespons 404/410;
- pengaturan install + notifikasi di Profil dan integrasi `PushManager` klien.

## Fakta kunci untuk melanjutkan

- **Port**: server `3000`, web dev `5173`, **citizen dev `5176`**.
  `CORS_ORIGIN` server (`apps/server/.env`) sudah memuat `5176` → tidak perlu
  edit untuk dev.
- **Backend TIDAK berubah**: semua procedure reporter sudah ada di
  `packages/api/src/modules/report/presentation/router.ts` (`reporterProcedure`,
  gate `role === "REPORTER"`). AI pipeline murni teks & mode-agnostic (kirim
  teks STT/ketik lewat `appendReporterText` = jalan identik).
- **Auth**: signup default REPORTER, cookie cross-origin sudah dikonfigurasi.
  Tidak perlu ubah server.
- **Design system**: `import "@siaga-app/ui/globals.css"` + `@siaga-app/ui/
  components/*`. Token brand `#870000`, Plus Jakarta Sans, light+dark.
  Komponen berguna: `message`, `bubble`, `message-scroller`, `avatar`,
  `badge`, `empty`, `card`, `button`, `field`, `input`, `sheet`, `dialog`.

## Perintah

```bash
# dari root repo
bun install
bun run dev:server            # backend di :3000 (butuh DB + .env)
cd apps/citizen && bun run dev # PWA di :5176

# validasi
cd apps/citizen && bun run check-types
cd apps/citizen && bun run build   # SPA → build/client/index.html

# tes di HP nyata (butuh HTTPS): deploy preview atau tunnel ke :5176
```

## Verifikasi penerimaan setelah deploy HTTPS
1. Buat akun REPORTER dan isi profil darurat.
2. Uji 3 mode: teks (balasan AI), suara Android (transkrip →
   `appendReporterText` → balasan → TTS), fallback ketik iOS.
3. Dorong status `SUBMITTED → ... → RESOLVED` melalui dashboard operator
   (`apps/web`), pastikan polling + `DispatchTimeline` + label cocok.
4. Pastikan laporan dari `apps/citizen` muncul live di map operator dan push
   diterima ketika status berubah.

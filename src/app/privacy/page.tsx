import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Kebijakan Privasi Data Pribadi",
  description: "Kebijakan Pelindungan Data Pribadi MatchLab sesuai UU No. 27 Tahun 2022 (UU PDP).",
};

// Legal note: Template drafted according to Indonesia's Personal Data Protection Act (UU PDP No. 27/2022).
export default function PrivacyPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@matchlab.id";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-8 py-12 md:py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Kebijakan Pelindungan Data Pribadi</h1>
          <p className="text-xs text-muted-foreground">
            Sesuai Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Data yang Kami Kumpulkan</h2>
            <p className="text-muted-foreground">
              Dalam pengoperasian Layanan, MatchLab mengumpulkan jenis data pribadi berikut:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>Data Identitas Akun:</strong> Nama lengkap, alamat email terverifikasi, dan kata sandi terenkripsi (scrypt).</li>
              <li><strong>Data Profil Kandidat:</strong> Ringkasan CV, riwayat keahlian (skills), tautan portofolio, dan lamaran pekerjaan yang diajukan.</li>
              <li><strong>Transkrip Wawancara AI:</strong> Percakapan tanya-jawab antara kandidat dan agen wawancara AI selama proses seleksi.</li>
              <li><strong>Data Teknis:</strong> Alamat IP, user-agent peramban, dan log audit keamanan.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Dasar Hukum dan Tujuan Pemrosesan</h2>
            <p className="text-muted-foreground">
              Pemrosesan data pribadi dilakukan atas dasar persetujuan eksplisit Anda saat mendaftar serta pelaksanaan kontrak layanan rekrutmen. Data digunakan untuk:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Menyelenggarakan sesi wawancara AI dan menghasilkan penilaian rubrik objektif.</li>
              <li>Menampilkan status seleksi kepada organisasi pemberi kerja yang Anda lamar.</li>
              <li>Mencegah kecurangan, duplikasi pendaftaran, dan penyalahgunaan kuota.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Pemrosesan Menggunakan Model Kecerdasan Buatan (AI)</h2>
            <p className="text-muted-foreground">
              MatchLab menggunakan penyedia model AI pihak ketiga yang memenuhi standar keamanan industri (misalnya OpenAI, Google Vertex, atau penyedia berlisensi lainnya). Kami tidak menjual data pribadi Anda kepada pihak ketiga manapun untuk keperluan pemasaran maupun periklanan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Hak-Hak Subjek Data Anda (Pasal 5 s.d. 13 UU PDP)</h2>
            <p className="text-muted-foreground">
              Sebagai Subjek Data Pribadi, Anda memiliki hak penuh untuk:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Mengakses dan memperoleh salinan data profil yang tersimpan.</li>
              <li>Memperbarui atau memperbaiki data pribadi yang tidak akurat via halaman profil.</li>
              <li>Mengajukan penghapusan akun dan data terkait melalui menu Pengaturan Akun.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">5. Petugas Pelindungan Data (DPO)</h2>
            <p className="text-muted-foreground">
              Untuk menggunakan hak Anda atau melaporkan kekhawatiran terkait privasi data, silakan hubungi kami di{" "}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                {supportEmail}
              </a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

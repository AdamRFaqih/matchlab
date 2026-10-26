import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan Layanan",
  description: "Syarat dan ketentuan penggunaan layanan MatchLab SaaS.",
};

// Legal note: Template drafted according to standard SaaS best practices and UU PDP No. 27/2022.
export default function TermsPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@matchlab.id";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-8 py-12 md:py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Syarat dan Ketentuan Layanan</h1>
          <p className="text-xs text-muted-foreground">
            Terakhir diperbarui: 26 Oktober 2026 • Berlaku efektif sejak publikasi
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Penerimaan Ketentuan</h2>
            <p className="text-muted-foreground">
              Dengan mendaftar, mengakses, atau menggunakan layanan MatchLab (&quot;Layanan&quot;), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat dengan Syarat dan Ketentuan ini. Jika Anda mendaftar atas nama organisasi, Anda menyatakan memiliki wewenang hukum untuk mengikat organisasi tersebut.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Deskripsi Layanan & Penggunaan AI</h2>
            <p className="text-muted-foreground">
              MatchLab menyediakan platform Software-as-a-Service (SaaS) untuk membantu organisasi mengelola proses rekrutmen melalui bantuan Artificial Intelligence (AI). Fitur meliputi penerjemah kebutuhan lowongan, wawancara percakapan awal (early screening), dan penilaian berbasis rubrik objektif.
            </p>
            <p className="text-muted-foreground">
              <strong>Pemberitahuan Khusus AI:</strong> Hasil evaluasi, skor kecocokan, dan transkrip wawancara AI bersifat sebagai alat pendukung keputusan (decision-support tool). Keputusan akhir penerimaan atau penolakan kandidat sepenuhnya merupakan hak prerogatif organisasi perekrut.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Akun Pengguna dan Keamanan</h2>
            <p className="text-muted-foreground">
              Anda bertanggung jawab menjaga kerahasiaan informasi login akun Anda dan seluruh aktivitas yang terjadi di bawah akun Anda. MatchLab berhak menangguhkan akun jika terindikasi aktivitas penyalahgunaan, upaya akses tidak sah, atau pelanggaran hukum yang berlaku.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Biaya, Paket Berlangganan, dan Pembayaran</h2>
            <p className="text-muted-foreground">
              Pembayaran paket diproses secara aman melalui gerbang pembayaran berlisensi (Midtrans). Seluruh transaksi menggunakan mata uang Rupiah (IDR). Kuota yang telah dibeli akan dikreditkan secara instan setelah pembayaran terkonfirmasi. MatchLab tidak menyediakan pengembalian dana (refund) untuk kuota yang telah dikonsumsi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">5. Batasan Tanggung Jawab</h2>
            <p className="text-muted-foreground">
              Layanan disediakan sebagaimana adanya (&quot;as is&quot;). Sepanjang diizinkan oleh hukum Indonesia, MatchLab tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau sengketa hubungan industrial antara pemberi kerja dan kandidat.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">6. Kontak Kami</h2>
            <p className="text-muted-foreground">
              Apabila Anda memiliki pertanyaan terkait ketentuan ini, silakan hubungi tim legal kami melalui{" "}
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

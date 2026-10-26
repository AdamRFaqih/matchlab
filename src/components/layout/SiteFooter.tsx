import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@matchlab.id";

  return (
    <footer className="border-t bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="p-1 rounded-md bg-primary text-primary-foreground">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>MatchLab</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Platform rekrutmen berbasis AI pertama untuk tim modern dan organisasi di Indonesia. Otomasi screening wawancara teknis & perilaku.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Produk
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="text-foreground/80 hover:text-foreground transition-colors">
                  Bursa Lowongan
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                  Harga & Paket
                </Link>
              </li>
              <li>
                <Link href="/signup?type=company" className="text-foreground/80 hover:text-foreground transition-colors">
                  Daftar Organisasi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Bantuan & Kontak
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  {supportEmail}
                </a>
              </li>
              <li>
                <Link href="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                  Pertanyaan Umum (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Legal & Privasi
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-foreground/80 hover:text-foreground transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-foreground/80 hover:text-foreground transition-colors">
                  Kebijakan Privasi (UU PDP)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MatchLab. Hak Cipta Dilindungi Undang-Undang.</p>
          <p>Ditenagai AI Generatif dengan standar etika transparansi penilaian.</p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-muted/20 text-center">
      <div className="space-y-4 max-w-md w-full bg-card border p-8 rounded-2xl shadow-xs">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Halaman yang Anda cari mungkin telah dipindahkan, dinonaktifkan, atau tautan yang Anda masukkan salah.
        </p>
        <div className="pt-2">
          <Link href="/" className={buttonVariants({ className: "w-full gap-2" })}>
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

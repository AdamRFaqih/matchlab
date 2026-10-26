import { getAppUrl } from "@/lib/request";

/** Email templates (Bahasa Indonesia, matching the product UI). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${cta.url}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(cta.label)}</a></p>
       <p style="font-size:12px;color:#6b7280">Jika tombol tidak berfungsi, salin tautan berikut ke browser Anda:<br/><a href="${cta.url}" style="color:#4f46e5;word-break:break-all">${cta.url}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:800;font-size:18px;margin-bottom:24px">✦ MatchLab</div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
      ${bodyHtml}
      ${button}
    </div>
    <p style="font-size:12px;color:#9ca3af;margin-top:24px">© ${new Date().getFullYear()} MatchLab · <a href="${getAppUrl()}" style="color:#9ca3af">${getAppUrl().replace(/^https?:\/\//, "")}</a></p>
  </div></body></html>`;
}

export function verificationEmail(name: string, url: string) {
  return {
    subject: "Verifikasi email akun MatchLab Anda",
    html: layout(
      `Halo ${name}, verifikasi email Anda`,
      `<p>Terima kasih telah mendaftar di MatchLab. Klik tombol di bawah untuk memverifikasi alamat email Anda. Tautan berlaku selama 24 jam.</p>`,
      { label: "Verifikasi Email", url }
    ),
    text: `Halo ${name},\n\nVerifikasi email akun MatchLab Anda melalui tautan berikut (berlaku 24 jam):\n${url}\n`,
  };
}

export function passwordResetEmail(name: string, url: string) {
  return {
    subject: "Atur ulang password MatchLab",
    html: layout(
      "Atur ulang password",
      `<p>Halo ${escapeHtml(name)}, kami menerima permintaan untuk mengatur ulang password akun Anda. Tautan berlaku selama 1 jam.</p><p>Jika Anda tidak meminta ini, abaikan email ini — password Anda tidak akan berubah.</p>`,
      { label: "Atur Ulang Password", url }
    ),
    text: `Halo ${name},\n\nAtur ulang password MatchLab Anda melalui tautan berikut (berlaku 1 jam):\n${url}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
  };
}

export function invitationEmail(params: {
  inviterName: string;
  organizationName: string;
  roleLabel: string;
  url: string;
}) {
  const { inviterName, organizationName, roleLabel, url } = params;
  return {
    subject: `${inviterName} mengundang Anda bergabung ke ${organizationName} di MatchLab`,
    html: layout(
      `Undangan bergabung ke ${organizationName}`,
      `<p><strong>${escapeHtml(inviterName)}</strong> mengundang Anda bergabung ke <strong>${escapeHtml(organizationName)}</strong> sebagai <strong>${escapeHtml(roleLabel)}</strong> di MatchLab. Undangan berlaku selama 7 hari.</p>`,
      { label: "Terima Undangan", url }
    ),
    text: `${inviterName} mengundang Anda bergabung ke ${organizationName} sebagai ${roleLabel} di MatchLab.\n\nTerima undangan (berlaku 7 hari):\n${url}\n`,
  };
}

export function paymentReceiptEmail(params: {
  organizationName: string;
  description: string;
  amountFormatted: string;
  orderId: string;
  url: string;
}) {
  return {
    subject: `Pembayaran berhasil — ${params.description}`,
    html: layout(
      "Pembayaran berhasil 🎉",
      `<p>Pembayaran untuk <strong>${escapeHtml(params.organizationName)}</strong> telah kami terima.</p>
       <table style="width:100%;font-size:14px;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:6px 0;color:#6b7280">Paket</td><td style="text-align:right">${escapeHtml(params.description)}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280">Total</td><td style="text-align:right;font-weight:700">${escapeHtml(params.amountFormatted)}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280">Order ID</td><td style="text-align:right;font-family:monospace">${escapeHtml(params.orderId)}</td></tr>
       </table>`,
      { label: "Lihat Tagihan", url: params.url }
    ),
    text: `Pembayaran untuk ${params.organizationName} berhasil.\nPaket: ${params.description}\nTotal: ${params.amountFormatted}\nOrder ID: ${params.orderId}\n\n${params.url}`,
  };
}

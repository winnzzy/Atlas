import Link from 'next/link';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

/** Renders a verified value, or a clearly-marked placeholder when unset. */
function ContactValue({ value, placeholder }: { value: string | null; placeholder: string }) {
  if (value) return <span className="text-slate-600">{value}</span>;
  return <span className="italic text-slate-400">{placeholder}</span>;
}

export function SiteFooter() {
  const year = 2026;

  return (
    <footer id="company" className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand + contact */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b345a] text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-900">Atlas</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              A secure digital banking workspace for accounts, payments, cards, and investments.
            </p>

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <ContactValue value={siteConfig.supportEmail} placeholder="Support email — not yet configured" />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <ContactValue value={siteConfig.supportPhone} placeholder="Support phone — not yet configured" />
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <ContactValue value={siteConfig.businessAddress} placeholder="Business address — not yet configured" />
              </div>
            </dl>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Product</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li><Link href="/signup" className="hover:text-slate-900">Open an account</Link></li>
              <li><Link href="/login" className="hover:text-slate-900">Sign in</Link></li>
              <li><a href="#products" className="hover:text-slate-900">Products</a></li>
              <li><a href="#security" className="hover:text-slate-900">Security</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Legal &amp; support</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li><Link href="/legal/privacy" className="hover:text-slate-900">Privacy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-slate-900">Terms</Link></li>
              <li><Link href="/legal/security" className="hover:text-slate-900">Security</Link></li>
              <li><Link href="/legal" className="hover:text-slate-900">Support &amp; contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Legal & Regulatory — structured, ready for verified information. */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-xs leading-5 text-slate-500">
          <p className="font-semibold text-slate-600">Legal &amp; Regulatory</p>
          <p className="mt-2">
            {siteConfig.legalEntity ? (
              <>{siteConfig.legalEntity}. </>
            ) : (
              <span className="italic text-slate-400">Legal entity — not yet configured. </span>
            )}
            {siteConfig.licenseInfo ? (
              <>{siteConfig.licenseInfo}. </>
            ) : (
              <span className="italic text-slate-400">Licensing information — not yet configured. </span>
            )}
          </p>
          <p className="mt-2">
            {siteConfig.depositInsuranceInfo ? (
              siteConfig.depositInsuranceInfo
            ) : (
              <span className="italic text-slate-400">
                Deposit insurance disclosure — not yet configured. Atlas makes no deposit-insurance
                or regulatory-membership claim until verified information is provided.
              </span>
            )}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>&copy; {year} Atlas. All rights reserved.</p>
          <p className="text-xs">Banking workspace for accounts, payments, cards, and investments.</p>
        </div>
      </div>
    </footer>
  );
}

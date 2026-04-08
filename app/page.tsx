import MarqueeSection from "@/components/MarqueeSection";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  name, price, sub, features, cta, ctaHref, highlight,
}: {
  name: string; price: string; sub: string; features: string[];
  cta: string; ctaHref: string; highlight?: boolean;
}) {
  return (
    <div className={`relative flex flex-col rounded-3xl p-7 border transition-all ${
      highlight
        ? "bg-gray-950 border-gray-950 text-white shadow-2xl scale-[1.03]"
        : "bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-lg"
    }`}>
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-violet-600 px-4 py-1 rounded-full uppercase tracking-widest">
          Populaire
        </div>
      )}
      <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${highlight ? "text-violet-400" : "text-gray-400"}`}>{name}</p>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-4xl font-black">{price}</span>
        {price !== "Gratuit" && <span className={`text-sm mb-1 ${highlight ? "text-gray-400" : "text-gray-400"}`}>/mois</span>}
      </div>
      <p className={`text-xs mb-7 ${highlight ? "text-gray-400" : "text-gray-500"}`}>{sub}</p>
      <ul className="flex-1 space-y-3 mb-8">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2.5 text-sm">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${highlight ? "bg-violet-600" : "bg-gray-100"}`}>
              <Check className={`w-2.5 h-2.5 ${highlight ? "text-white" : "text-gray-600"}`} />
            </div>
            <span className={highlight ? "text-gray-300" : "text-gray-600"}>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaHref}
        className={`block text-center py-3.5 rounded-2xl text-sm font-bold transition-all ${
          highlight
            ? "bg-violet-600 hover:bg-violet-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        }`}>
        {cta}
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 overflow-x-hidden font-sans">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#fafaf9]/90 backdrop-blur-xl border-b border-gray-200/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gray-950 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">adorable</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
          <a href="#how" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
            Connexion
          </Link>
          <Link href="/login"
            className="flex items-center gap-1.5 text-sm font-semibold bg-gray-950 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-all">
            Commencer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-8 overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-100 rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-pink-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />

        <div className="relative inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-8 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Propulsé par Claude AI
        </div>

        <h1 className="relative text-5xl md:text-7xl lg:text-8xl font-black leading-[1.0] tracking-[-0.03em] max-w-4xl mb-7 text-gray-950">
          Ton site web,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500">
            en une phrase.
          </span>
        </h1>

        <p className="relative text-lg md:text-xl text-gray-500 max-w-lg leading-relaxed mb-10">
          Décris ton activité. Adorable génère un site professionnel complet en quelques secondes.
          Modifie-le en conversant — sans toucher au code.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-3 mb-4">
          <Link href="/login"
            className="flex items-center justify-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg hover:-translate-y-0.5">
            <Zap className="w-4 h-4" />
            Créer mon site gratuitement
          </Link>
          <a href="#how"
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium px-8 py-4 rounded-2xl text-sm transition-all">
            Voir comment ça marche
          </a>
        </div>
        <p className="text-xs text-gray-400">Sans CB · Prêt en moins de 1 minute</p>
      </section>

      {/* ── Showcase marquee — always visible, always beautiful ── */}
      <section className="relative py-10 overflow-hidden">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#fafaf9] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#fafaf9] to-transparent z-10 pointer-events-none" />
        <MarqueeSection />
      </section>

      {/* ── Social proof strip ── */}
      <div className="flex items-center justify-center gap-8 md:gap-16 px-6 py-6 border-y border-gray-100">
        {[
          { value: "< 1 min", label: "pour créer" },
          { value: "1 200+", label: "sites générés" },
          { value: "0€", label: "pour commencer" },
          { value: "4.9 ★", label: "satisfaction" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-xl font-black text-gray-950">{value}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-28">
        <div className="text-center mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Simple</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-950 mb-4">
            Trois étapes, c'est tout.
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Pas de formation, pas d'agence, pas de semaines d'attente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              title: "Décris ton activité",
              desc: "Ton nom, ton métier, tes services. En français, naturellement. Plus tu es précis, plus le résultat est bluffant.",
              color: "bg-violet-50 border-violet-100",
              accent: "text-violet-600",
            },
            {
              n: "02",
              title: "L'IA construit le site",
              desc: "En quelques secondes, un site complet apparaît — hero, services, témoignages, contact — adapté à ton secteur.",
              color: "bg-pink-50 border-pink-100",
              accent: "text-pink-600",
            },
            {
              n: "03",
              title: "Publie et affine",
              desc: "Un clic pour mettre en ligne. Dis \"change la couleur\", \"ajoute une FAQ\" — l'IA modifie en temps réel.",
              color: "bg-amber-50 border-amber-100",
              accent: "text-amber-600",
            },
          ].map(({ n, title, desc, color, accent }) => (
            <div key={n} className={`rounded-3xl border p-8 ${color}`}>
              <span className={`text-4xl font-black tabular-nums ${accent} opacity-30 block mb-4`}>{n}</span>
              <h3 className="font-bold text-lg text-gray-950 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Second marquee + overlay message ── */}
      <section className="relative bg-gray-950 py-20 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

        {/* Tinted marquee overlay */}
        <div className="opacity-20">
          <MarqueeSection />
        </div>

        {/* Center message */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4">
            Restaurant, portfolio, SaaS,<br className="hidden md:block" />
            boutique, cabinet, coach…
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Adorable crée un design spécifique à chaque métier. Jamais un template générique.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Tarifs</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-950 mb-4">
            Transparent. Sans surprise.
          </h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            Commence gratuitement. Passe à Pro quand tu es prêt.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
          <PricingCard
            name="Gratuit"
            price="Gratuit"
            sub="Pour tester"
            features={["1 site", "20 générations IA / jour", "Hébergement inclus"]}
            cta="Commencer"
            ctaHref="/login"
          />
          <PricingCard
            name="Pro"
            price="19€"
            sub="7 jours d'essai · sans CB"
            features={["Sites illimités", "IA illimitée", "Domaine personnalisé", "Support prioritaire"]}
            cta="Essayer Pro gratuitement"
            ctaHref="/login"
            highlight
          />
          <PricingCard
            name="Starter"
            price="6€"
            sub="Sans engagement"
            features={["5 sites", "100 générations / jour", "Versions illimitées"]}
            cta="Passer à Starter"
            ctaHref="/login"
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Aucune CB requise · Annulation à tout moment · TVA incluse
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-6 py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fafaf9] via-violet-50/60 to-[#fafaf9] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-gray-950 mb-5 leading-tight">
            Ton site est à<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">30 secondes.</span>
          </h2>
          <p className="text-gray-500 mb-10 text-lg max-w-sm mx-auto">
            Rejoins les créateurs qui ont déjà lancé avec Adorable.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all shadow-xl hover:-translate-y-0.5">
            <Zap className="w-5 h-5" />
            Créer mon site gratuitement
          </Link>
          <p className="text-xs text-gray-400 mt-4">Sans CB · En ligne en moins de 1 minute</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-950 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm text-gray-950">adorable</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="/terms" className="hover:text-gray-700 transition-colors">CGU</a>
            <a href="/privacy" className="hover:text-gray-700 transition-colors">Confidentialité</a>
            <a href="mailto:hello@adorable.click" className="hover:text-gray-700 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400">© 2025 Adorable · Fait en France</p>
        </div>
      </footer>
    </div>
  )
}

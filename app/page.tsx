import MarqueeSection from "@/components/MarqueeSection";
import TypewriterWord from "@/components/TypewriterWord";
import { ArrowRight, Check, Zap } from "lucide-react";
import Link from "next/link";

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  name,
  price,
  sub,
  features,
  cta,
  ctaHref,
  highlight,
}: {
  name: string;
  price: string;
  sub: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl p-7 border transition-all ${
        highlight
          ? "bg-gray-950 border-gray-950 text-white shadow-2xl scale-[1.03]"
          : "bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-violet-600 px-4 py-1 rounded-full uppercase tracking-widest">
          Populaire
        </div>
      )}
      <p
        className={`text-xs font-bold uppercase tracking-widest mb-4 ${highlight ? "text-violet-400" : "text-gray-400"}`}
      >
        {name}
      </p>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-4xl font-black">{price}</span>
        {price !== "Gratuit" && (
          <span
            className={`text-sm mb-1 ${highlight ? "text-gray-400" : "text-gray-400"}`}
          >
            /mois
          </span>
        )}
      </div>
      <p
        className={`text-xs mb-7 ${highlight ? "text-gray-400" : "text-gray-500"}`}
      >
        {sub}
      </p>
      <ul className="flex-1 space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${highlight ? "bg-violet-600" : "bg-gray-100"}`}
            >
              <Check
                className={`w-2.5 h-2.5 ${highlight ? "text-white" : "text-gray-600"}`}
              />
            </div>
            <span className={highlight ? "text-gray-300" : "text-gray-600"}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`block text-center py-3.5 rounded-2xl text-sm font-bold transition-all ${
          highlight
            ? "bg-violet-600 hover:bg-violet-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 overflow-x-hidden font-sans">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#fafaf9]/90 backdrop-blur-xl border-b border-gray-200/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gray-950 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">adorable</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
          <a href="#how" className="hover:text-gray-900 transition-colors">
            Comment ça marche
          </a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">
            Tarifs
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
          >
            Connexion
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-semibold bg-gray-950 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-all"
          >
            Commencer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-8 overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-100 rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-pink-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />
        <h1 className="relative text-5xl md:text-7xl lg:text-8xl font-black leading-[1.0] tracking-[-0.03em] max-w-4xl mb-7 text-gray-950">
          Votre <TypewriterWord /> mérite
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500">
            un beau site web.
          </span>
        </h1>

        <p className="relative text-lg md:text-xl text-gray-500 max-w-lg leading-relaxed mb-10">
          Boulangerie, salon, café, restaurant… Décris ton activité en quelques
          mots et Adorable crée ton site professionnel en moins d'une minute —
          sans agence, sans code.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-3 mb-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4" />
            Créer mon site gratuitement
          </Link>
          <a
            href="#how"
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium px-8 py-4 rounded-2xl text-sm transition-all"
          >
            Voir comment ça marche
          </a>
        </div>
        <p className="text-xs text-gray-400">
          Sans CB · Prêt en moins de 1 minute · Aucune compétence technique
          requise
        </p>
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
          { value: "1 200+", label: "commerces en ligne" },
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
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">
            Simple
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-950 mb-4">
            Trois étapes, c'est tout.
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Pas de formation, pas d'agence, pas de semaines d'attente. Juste toi
            et ton activité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              title: "Décris ton commerce",
              desc: "Ton nom, ton adresse, tes horaires, tes spécialités. En français, comme tu parlerais à un client. Trente secondes suffisent.",
              color: "bg-violet-50 border-violet-100",
              accent: "text-violet-600",
            },
            {
              n: "02",
              title: "L'IA crée ton site",
              desc: "En quelques secondes, un site complet apparaît — présentation, services, horaires, galerie photos, formulaire de contact.",
              color: "bg-pink-50 border-pink-100",
              accent: "text-pink-600",
            },
            {
              n: "03",
              title: "Publie et mets à jour",
              desc: 'Un clic pour mettre en ligne. Dis "ajoute les horaires de Noël" ou "change la photo" — l\'IA s\'en charge.',
              color: "bg-amber-50 border-amber-100",
              accent: "text-amber-600",
            },
          ].map(({ n, title, desc, color, accent }) => (
            <div key={n} className={`rounded-3xl border p-8 ${color}`}>
              <span
                className={`text-4xl font-black tabular-nums ${accent} opacity-30 block mb-4`}
              >
                {n}
              </span>
              <h3 className="font-bold text-lg text-gray-950 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Marquee with text overlay ── */}
      <section className="relative py-20 overflow-hidden bg-[#fafaf9]">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#fafaf9] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#fafaf9] to-transparent z-10 pointer-events-none" />

        <div className="opacity-25 pointer-events-none">
          <MarqueeSection />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-6 pointer-events-none">
          <h2 className="text-4xl md:text-6xl font-black text-gray-950 leading-tight tracking-tight mb-4">
            Boulangerie, coiffeur,
            <br className="hidden md:block" />
            café, restaurant, artisan…
          </h2>
          <p className="text-gray-500 text-lg max-w-md">
            Adorable crée un design sur-mesure pour chaque commerce. Jamais un
            template générique.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">
            Tarifs
          </p>
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
            sub="Pour découvrir"
            features={[
              "1 site",
              "5 générations IA / jour",
              "Hébergement inclus",
            ]}
            cta="Commencer"
            ctaHref="/login"
          />
          <PricingCard
            name="Starter"
            price="49€"
            sub="7 jours d'essai · sans CB"
            features={[
              "5 sites",
              "100 générations IA / jour",
              "Domaine personnalisé",
              "Commandes & boutique",
              "Versions illimitées",
            ]}
            cta="Essayer gratuitement"
            ctaHref="/login"
            highlight
          />
          <PricingCard
            name="Pro"
            price="89€"
            sub="Sans engagement"
            features={[
              "Sites illimités",
              "IA illimitée",
              "Domaine personnalisé",
              "Commandes & boutique",
              "Support prioritaire",
            ]}
            cta="Passer à Pro"
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
            Ton <TypewriterWord /> mérite
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">
              d'être en ligne.
            </span>
          </h2>
          <p className="text-gray-500 mb-10 text-lg max-w-sm mx-auto">
            Rejoins les commerçants qui ont déjà leur site avec Adorable.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all shadow-xl shadow-violet-500/30 hover:-translate-y-0.5"
          >
            <Zap className="w-5 h-5" />
            Créer mon site gratuitement
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Sans CB · En ligne en moins de 1 minute
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-950 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm text-gray-950">adorable</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="/terms" className="hover:text-gray-700 transition-colors">
              CGU
            </a>
            <a
              href="/privacy"
              className="hover:text-gray-700 transition-colors"
            >
              Confidentialité
            </a>
            <a
              href="mailto:hello@adorable.click"
              className="hover:text-gray-700 transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-xs text-gray-400">
            © 2025 Adorable · Fait en France
          </p>
        </div>
      </footer>
    </div>
  );
}

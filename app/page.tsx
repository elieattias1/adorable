import MarqueeSection from "@/components/MarqueeSection";
import {
  ArrowRight,
  Check,
  Crown,
  Globe,
  MessageSquare,
  Rocket,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";

// ─── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-black gradient-text">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-pink-600/30 border border-violet-500/30 flex items-center justify-center text-violet-400">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">
          {n}
        </span>
      </div>
      <div>
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[200px] mx-auto">
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function Feature({
  icon,
  title,
  desc,
  pro,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  pro?: boolean;
}) {
  return (
    <div className="relative bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-violet-500/30 hover:bg-white/5 transition-all group">
      {pro && (
        <span className="absolute top-3 right-3 text-[9px] font-bold text-violet-400 bg-violet-950/60 px-1.5 py-0.5 rounded-full border border-violet-700/40">
          PRO
        </span>
      )}
      <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-700/30 flex items-center justify-center text-violet-400 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

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
      className={`relative flex flex-col rounded-2xl p-6 border ${highlight ? "bg-violet-950/40 border-violet-600/60 shadow-xl shadow-violet-950/40" : "bg-white/3 border-white/8"}`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-1 rounded-full uppercase tracking-widest">
          Le plus populaire
        </div>
      )}
      <div className="mb-5">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
          {name}
        </p>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black">{price}</span>
          {price !== "Gratuit" && (
            <span className="text-gray-500 text-sm mb-1">/mois</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{sub}</p>
      </div>
      <ul className="flex-1 space-y-2.5 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check
              className={`w-3.5 h-3.5 flex-shrink-0 ${highlight ? "text-violet-400" : "text-gray-600"}`}
            />
            <span className={highlight ? "text-gray-200" : "text-gray-400"}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${
          highlight
            ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
            : "border border-white/10 text-gray-300 hover:border-white/20 hover:text-white"
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
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-gray-950/90 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg">Adorable</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#how" className="hover:text-white transition-colors">
            Comment ça marche
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Fonctionnalités
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Tarifs
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            Se connecter
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl transition-all"
          >
            Commencer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/3 w-[300px] h-[200px] bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        {/* <div className="relative flex items-center gap-2 bg-violet-950/60 border border-violet-700/40 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          <Sparkles className="w-3 h-3" />
          Propulsé par Claude AI · Nouvelle génération
        </div> */}

        {/* Headline */}
        <h1 className="relative text-5xl md:text-7xl font-black leading-[1.05] tracking-tight max-w-4xl mb-6">
          Ton site web en <span className="gradient-text">30 secondes</span>,
          <br />
          pas en 30 jours.
        </h1>

        <p className="relative text-lg text-gray-400 max-w-xl leading-relaxed mb-10">
          Décris ton activité en quelques mots. Adorable génère un site
          professionnel complet, que tu peux modifier en conversant avec l'IA.
          Sans code, sans agence, sans compromis.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-3 mb-14">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg shadow-violet-950/50 hover:shadow-violet-900/60 hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4" />
            Créer mon site gratuitement
          </Link>
          <a
            href="#how"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-2xl text-sm transition-all"
          >
            Voir comment ça marche
          </a>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8 sm:gap-12 px-8 py-4 bg-white/3 border border-white/8 rounded-2xl">
          <Stat value="< 1 min" label="pour créer" />
          <div className="w-px bg-white/8" />
          <Stat value="1 200+" label="sites générés" />
          <div className="w-px bg-white/8" />
          <Stat value="0€" label="pour commencer" />
        </div>
      </section>

      {/* ── Marquee showcase ── */}
      <section className="relative py-6 overflow-hidden">
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-gray-950 to-transparent z-10 pointer-events-none" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-950 to-transparent z-10 pointer-events-none" />

        <MarqueeSection />

        {/* Center overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="bg-gray-950/75 backdrop-blur-md rounded-2xl px-8 py-5 border border-white/8 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              Des milliers de créateurs
            </p>
            <h2 className="text-2xl font-black">
              Décris. <span className="gradient-text">Adorable construit.</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Restaurant, portfolio, SaaS, boutique…
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">
            Simple comme bonjour
          </p>
          <h2 className="text-4xl font-black mb-4">Ton site en 3 étapes</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Pas besoin de connaissance technique. Adorable s'occupe de tout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+14px)] right-[calc(16.67%+14px)] h-px bg-gradient-to-r from-violet-600/30 via-pink-600/30 to-violet-600/30" />

          <Step
            n={1}
            icon={<MessageSquare className="w-6 h-6" />}
            title="Décris ton activité"
            desc="Dis-nous qui tu es : ton métier, tes services, ton ambition. Plus tu es précis, plus le résultat est bluffant."
          />
          <Step
            n={2}
            icon={<Sparkles className="w-6 h-6" />}
            title="L'IA génère ton site"
            desc="En quelques secondes, Claude AI conçoit un site complet, beau et structuré, adapté à ton secteur."
          />
          <Step
            n={3}
            icon={<Rocket className="w-6 h-6" />}
            title="Publie en un clic"
            desc="Ton site est en ligne instantanément. Modifie-le à l'infini par simple conversation, sans toucher au code."
          />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <div className="text-center mb-14">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">
            Tout ce dont tu as besoin
          </p>
          <h2 className="text-4xl font-black mb-4">
            Des fonctionnalités qui font la différence
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Adorable n'est pas un constructeur de sites ordinaire — c'est ton agence
            web IA disponible 24h/24.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature
            icon={<MessageSquare className="w-4 h-4" />}
            title="Éditeur conversationnel"
            desc={
              'Dis "rends le bouton plus grand" ou "ajoute une section témoignages" — l\'IA comprend et modifie instantanément.'
            }
          />
          <Feature
            icon={<Star className="w-4 h-4" />}
            title="Design professionnel"
            desc="Chaque site est conçu avec des conventions visuelles propres à ton secteur. Pas un template générique."
          />
          <Feature
            icon={<Globe className="w-4 h-4" />}
            title="Hébergement inclus"
            desc="Ton site est hébergé chez nous, accessible via un lien Adorable. Aucune configuration requise."
          />
          <Feature
            icon={<Zap className="w-4 h-4" />}
            title="Générations illimitées"
            desc="Regenere, modifie, affine autant que tu veux. Chaque conversation améliore ton site."
          />
          <Feature
            icon={<Rocket className="w-4 h-4" />}
            title="Domaine personnalisé"
            desc="Connecte ton propre domaine (monsite.fr) pour une image professionnelle complète."
            pro
          />
          <Feature
            icon={<Crown className="w-4 h-4" />}
            title="Support prioritaire"
            desc="Une question, un bug ? Notre équipe répond en moins de 2h pour les membres Pro."
            pro
          />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-3xl mx-auto px-6 py-10 pb-24">
        <div className="text-center mb-14">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">
            Transparent et sans surprise
          </p>
          <h2 className="text-4xl font-black mb-4">Des tarifs honnêtes</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Commence gratuitement, sans CB. Passe à Pro quand tu es prêt à
            conquérir le monde.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <PricingCard
            name="Gratuit"
            price="Gratuit"
            sub="Pour tester et découvrir"
            features={[
              "1 site inclus",
              "20 générations IA / jour",
              "5 versions par site",
              "Hébergement Adorable",
            ]}
            cta="Commencer gratuitement"
            ctaHref="/login"
          />
          <PricingCard
            name="Starter"
            price="6€"
            sub="Sans engagement"
            features={[
              "5 sites",
              "100 générations IA / jour",
              "Versions illimitées",
              "Hébergement Adorable",
            ]}
            cta="Passer à Starter"
            ctaHref="/login"
          />
          <PricingCard
            name="Pro"
            price="19€"
            sub="7 jours d'essai gratuit — sans CB"
            features={[
              "Sites illimités",
              "IA illimitée",
              "Domaine personnalisé",
              "Support prioritaire < 2h",
            ]}
            cta="Essayer Pro gratuitement"
            ctaHref="/login"
            highlight
          />
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Aucune CB requise · Annulation à tout moment · TVA incluse
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-6 py-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Prêt à <span className="gradient-text">conquérir le web</span> ?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Rejoins les créateurs qui ont déjà lancé leur site avec Adorable. Ton
            site est à 30 secondes.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all shadow-2xl shadow-violet-950/60 hover:-translate-y-0.5"
          >
            <Zap className="w-5 h-5" />
            Créer mon site gratuitement
          </Link>
          <p className="text-xs text-gray-600 mt-4">
            Sans CB · Prêt en moins de 1 minute
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm">Adorable</span>
          </div>

          <div className="flex gap-6 text-xs text-gray-600">
            <a href="/terms" className="hover:text-gray-400 transition-colors">
              CGU
            </a>
            <a
              href="/privacy"
              className="hover:text-gray-400 transition-colors"
            >
              Confidentialité
            </a>
            <a
              href="mailto:hello@adorable.click"
              className="hover:text-gray-400 transition-colors"
            >
              Contact
            </a>
          </div>

          <p className="text-xs text-gray-700">
            © 2025 Adorable · Fait avec ⚡ en France
          </p>
        </div>
      </footer>
    </div>
  );
}

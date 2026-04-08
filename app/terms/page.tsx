import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation — Adorable",
  description: "Conditions générales d'utilisation et mentions légales du service Adorable.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
      <div className="text-gray-400 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-gray-950/90 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg">Adorable</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Se connecter
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-3">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-gray-500 text-sm">Dernière mise à jour : avril 2025</p>
        </div>

        {/* Mentions légales */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-12">
          <h2 className="text-base font-bold mb-4 text-white">Mentions légales</h2>
          <div className="text-sm text-gray-400 space-y-1.5">
            <p><strong className="text-white">Éditeur du service :</strong> Adorable</p>
            <p>
              <strong className="text-white">Contact :</strong>{" "}
              <a href="mailto:hello@adorable.click" className="text-violet-400 hover:underline">
                hello@adorable.click
              </a>
            </p>
            <p><strong className="text-white">Site web :</strong> adorable.click</p>
            <p>
              <strong className="text-white">Hébergement :</strong> Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis —{" "}
              <a href="https://vercel.com" className="text-violet-400 hover:underline" target="_blank" rel="noopener">
                vercel.com
              </a>
            </p>
            <p className="pt-2 text-xs text-gray-600">
              Directeur de la publication : l&apos;équipe Adorable
            </p>
          </div>
        </div>

        <Section title="1. Objet">
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (ci-après «&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation du service Adorable, plateforme de création de sites web par intelligence artificielle, accessible à l&apos;adresse{" "}
            <span className="text-white">adorable.click</span> (ci-après «&nbsp;le Service&nbsp;»).
          </p>
          <p>
            L&apos;utilisation du Service implique l&apos;acceptation sans réserve des présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.
          </p>
        </Section>

        <Section title="2. Description du service">
          <p>
            Adorable est un service SaaS (Software as a Service) permettant à ses utilisateurs de créer, personnaliser et publier des sites web à l&apos;aide d&apos;une interface conversationnelle alimentée par de l&apos;intelligence artificielle.
          </p>
          <p>Le Service comprend notamment :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>La génération automatique de sites web à partir de descriptions textuelles</li>
            <li>Un éditeur conversationnel permettant de modifier les sites</li>
            <li>L&apos;hébergement des sites publiés sur une URL Adorable</li>
            <li>La connexion d&apos;un nom de domaine personnalisé (offre payante)</li>
            <li>La gestion des formulaires de contact</li>
            <li>L&apos;historique des versions du site</li>
          </ul>
        </Section>

        <Section title="3. Accès au service et création de compte">
          <p>
            L&apos;accès au Service nécessite la création d&apos;un compte utilisateur. Vous devez fournir une adresse e-mail valide et, le cas échéant, un mot de passe. Vous pouvez également vous connecter via votre compte Google.
          </p>
          <p>Vous êtes responsable de :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>La confidentialité de vos identifiants de connexion</li>
            <li>Toute activité effectuée depuis votre compte</li>
            <li>La véracité des informations fournies lors de l&apos;inscription</li>
          </ul>
          <p>
            Toute utilisation non autorisée de votre compte doit nous être signalée immédiatement à{" "}
            <a href="mailto:hello@adorable.click" className="text-violet-400 hover:underline">
              hello@adorable.click
            </a>
            .
          </p>
        </Section>

        <Section title="4. Offres et tarifs">
          <p>Le Service est proposé selon trois formules :</p>

          <div className="space-y-4 mt-2">
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <p className="font-semibold text-white mb-1">Gratuit — 0&nbsp;€/mois</p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>1 site</li>
                <li>20 générations IA par jour</li>
                <li>5 versions par site</li>
                <li>Hébergement sur sous-domaine Adorable</li>
              </ul>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <p className="font-semibold text-white mb-1">Starter — 6&nbsp;€ HT/mois</p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>5 sites</li>
                <li>100 générations IA par jour</li>
                <li>Versions illimitées</li>
                <li>Hébergement sur sous-domaine Adorable</li>
              </ul>
            </div>
            <div className="bg-white/3 border border-violet-600/40 rounded-xl p-4">
              <p className="font-semibold text-white mb-1">Pro — 19&nbsp;€ HT/mois</p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>Sites illimités</li>
                <li>IA illimitée</li>
                <li>Domaine personnalisé</li>
                <li>Support prioritaire (&lt;&nbsp;2&nbsp;h)</li>
              </ul>
            </div>
          </div>

          <p className="mt-3">
            Les prix sont indiqués hors taxes (HT). La TVA applicable sera ajoutée en fonction de votre pays de résidence. Les abonnements sont sans engagement et renouvelés automatiquement chaque mois. Vous pouvez résilier à tout moment depuis votre espace client.
          </p>
          <p>
            Adorable se réserve le droit de modifier ses tarifs avec un préavis de 30 jours par e-mail.
          </p>
        </Section>

        <Section title="5. Paiement">
          <p>
            Les paiements sont traités par <strong className="text-white">Stripe</strong>, prestataire de paiement sécurisé certifié PCI-DSS. En souscrivant à une offre payante, vous autorisez Stripe à débiter le moyen de paiement renseigné selon la périodicité choisie.
          </p>
          <p>
            En cas d&apos;échec de paiement, l&apos;accès aux fonctionnalités payantes peut être suspendu jusqu&apos;à régularisation. Aucun remboursement n&apos;est effectué pour les périodes entamées, sauf disposition légale contraire.
          </p>
        </Section>

        <Section title="6. Droit de rétractation">
          <p>
            Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas aux abonnements à des contenus numériques dont l&apos;exécution a commencé avec votre accord exprès.
          </p>
          <p>
            Cependant, nous offrons un essai gratuit de 7 jours sur l&apos;offre Pro sans CB. Si vous n&apos;êtes pas satisfait, vous pouvez résilier avant la fin de la période d&apos;essai sans être débité.
          </p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>
            <strong className="text-white">Contenu généré par l&apos;IA :</strong> Le code HTML/CSS et le contenu des sites générés par le Service vous sont cédés librement. Vous êtes libre de les utiliser, modifier et publier.
          </p>
          <p>
            <strong className="text-white">Contenu apporté par l&apos;utilisateur :</strong> Vous conservez la propriété de tout contenu que vous fournissez (textes, images, marques, logos). Vous nous accordez une licence non exclusive pour héberger et afficher ce contenu dans le cadre de la fourniture du Service.
          </p>
          <p>
            <strong className="text-white">Service et marque Adorable :</strong> Le code source, le design, la marque et les éléments graphiques du Service sont la propriété exclusive d&apos;Adorable et protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.
          </p>
        </Section>

        <Section title="8. Obligations de l'utilisateur">
          <p>En utilisant le Service, vous vous engagez à ne pas :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Utiliser le Service à des fins illégales ou contraires aux bonnes mœurs</li>
            <li>Publier des contenus haineux, diffamatoires, pornographiques ou illicites</li>
            <li>Violer les droits de propriété intellectuelle de tiers</li>
            <li>Tenter de compromettre la sécurité du Service</li>
            <li>Utiliser le Service pour envoyer des communications non sollicitées (spam)</li>
            <li>Revendre ou sous-licencier l&apos;accès au Service sans autorisation</li>
          </ul>
          <p>
            Adorable se réserve le droit de suspendre ou résilier tout compte en cas de violation de ces obligations.
          </p>
        </Section>

        <Section title="9. Disponibilité et garanties">
          <p>
            Adorable s&apos;engage à fournir le Service avec le soin raisonnable d&apos;un prestataire professionnel, mais ne garantit pas une disponibilité ininterrompue (99,9% de disponibilité visée, hors maintenances planifiées). Le Service est fourni «&nbsp;tel quel&nbsp;» (as is).
          </p>
          <p>
            Les contenus générés par l&apos;IA peuvent être imprécis, incomplets ou non adaptés à votre usage. Adorable ne saurait être tenu responsable des décisions prises sur la base des contenus générés.
          </p>
        </Section>

        <Section title="10. Limitation de responsabilité">
          <p>
            Dans les limites autorisées par la loi française, la responsabilité d&apos;Adorable est limitée au montant des sommes effectivement versées par l&apos;utilisateur au cours des 12 derniers mois précédant l&apos;événement à l&apos;origine du dommage.
          </p>
          <p>
            Adorable ne saurait être responsable des dommages indirects (perte de chiffre d&apos;affaires, perte de données, atteinte à l&apos;image) résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le Service.
          </p>
        </Section>

        <Section title="11. Résiliation">
          <p>
            Vous pouvez résilier votre abonnement à tout moment depuis votre espace client. La résiliation prend effet à la fin de la période en cours. Vos données sont conservées 90 jours après résiliation, puis supprimées définitivement.
          </p>
          <p>
            Adorable peut résilier votre accès immédiatement en cas de violation des présentes CGU, avec notification par e-mail.
          </p>
        </Section>

        <Section title="12. Modification des CGU">
          <p>
            Adorable peut modifier les présentes CGU à tout moment. Les modifications entrent en vigueur 30 jours après notification par e-mail. L&apos;utilisation continue du Service après ce délai vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section title="13. Droit applicable et litiges">
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux compétents seront ceux du ressort du siège social d&apos;Adorable, sauf disposition légale contraire applicable aux consommateurs.
          </p>
          <p>
            Conformément à l&apos;article 14 du Règlement (UE) n°&nbsp;524/2013, vous pouvez également recourir à la plateforme de résolution des litiges en ligne de la Commission européenne :{" "}
            <a href="https://ec.europa.eu/consumers/odr" className="text-violet-400 hover:underline" target="_blank" rel="noopener">
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Pour toute question relative aux présentes CGU :{" "}
            <a href="mailto:hello@adorable.click" className="text-violet-400 hover:underline">
              hello@adorable.click
            </a>
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm">Adorable</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-600">
            <Link href="/terms" className="hover:text-gray-400 transition-colors">CGU</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Confidentialité</Link>
            <a href="mailto:hello@adorable.click" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-700">© 2025 Adorable · Fait avec ⚡ en France</p>
        </div>
      </footer>
    </div>
  );
}

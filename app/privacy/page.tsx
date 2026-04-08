import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Politique de confidentialité — Adorable",
  description: "Comment Adorable collecte, utilise et protège vos données personnelles.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4 text-gray-950">{title}</h2>
      <div className="text-gray-500 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-gray-200/60 bg-[#fafaf9]/90 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-xl bg-gray-950 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-gray-950">adorable</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Se connecter
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-3">Politique de confidentialité</h1>
          <p className="text-gray-500 text-sm">Dernière mise à jour : avril 2025</p>
        </div>

        <Section title="1. Qui sommes-nous ?">
          <p>
            Le présent service est exploité par la société <strong className="text-gray-900">Adorable</strong> (ci-après «&nbsp;nous&nbsp;»), joignable à l'adresse{" "}
            <a href="mailto:hello@adorable.click" className="text-violet-600 hover:underline">
              hello@adorable.click
            </a>
            .
          </p>
          <p>
            Adorable est un service de création de sites web par intelligence artificielle, accessible à l'adresse{" "}
            <span className="text-gray-900">adorable.click</span>.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>
              <strong className="text-gray-900">Données de compte :</strong> adresse e-mail, mot de passe (hashé), date d'inscription, fournisseur d'authentification (email/Google).
            </li>
            <li>
              <strong className="text-gray-900">Données de contenu :</strong> textes, images et informations que vous saisissez pour créer votre site.
            </li>
            <li>
              <strong className="text-gray-900">Données de paiement :</strong> gérées exclusivement par Stripe. Nous ne stockons aucune information bancaire.
            </li>
            <li>
              <strong className="text-gray-900">Données de navigation :</strong> adresse IP, type de navigateur, pages visitées, durée de session, à des fins d'analyse et de sécurité.
            </li>
            <li>
              <strong className="text-gray-900">Données de formulaires :</strong> les réponses soumises via les formulaires de contact générés sur vos sites sont stockées dans notre base de données et vous sont transmises par e-mail.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont utilisées pour :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Fournir le service de génération et d'hébergement de sites web</li>
            <li>Traiter vos paiements et gérer vos abonnements</li>
            <li>Vous envoyer des e-mails transactionnels (confirmation d'inscription, notifications de formulaire, alertes de déploiement)</li>
            <li>Améliorer et sécuriser notre service</li>
            <li>Respecter nos obligations légales</li>
          </ul>
          <p>
            La base légale du traitement est l'exécution du contrat (fourniture du service), votre consentement (e-mails marketing, si applicable), et nos intérêts légitimes (sécurité, amélioration du service).
          </p>
        </Section>

        <Section title="4. Partage des données">
          <p>Nous ne vendons jamais vos données. Elles peuvent être partagées avec les sous-traitants suivants, strictement dans le cadre de la fourniture du service :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>
              <strong className="text-gray-900">Supabase</strong> — base de données et authentification (États-Unis, couverture SCCs)
            </li>
            <li>
              <strong className="text-gray-900">Vercel</strong> — hébergement des sites publiés (États-Unis, couverture SCCs)
            </li>
            <li>
              <strong className="text-gray-900">Stripe</strong> — traitement des paiements (États-Unis, certifié PCI-DSS)
            </li>
            <li>
              <strong className="text-gray-900">Resend</strong> — envoi d'e-mails transactionnels (États-Unis, couverture SCCs)
            </li>
            <li>
              <strong className="text-gray-900">Anthropic</strong> — génération de contenu par IA (États-Unis, couverture SCCs)
            </li>
          </ul>
        </Section>

        <Section title="5. Durée de conservation">
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Données de compte : conservées pendant toute la durée de l'abonnement, puis supprimées dans un délai de 90 jours après résiliation.</li>
            <li>Données de facturation : conservées 10 ans conformément aux obligations légales françaises.</li>
            <li>Logs de sécurité : conservés 12 mois maximum.</li>
          </ul>
        </Section>

        <Section title="6. Vos droits (RGPD)">
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong className="text-gray-900">Accès</strong> — obtenir une copie de vos données</li>
            <li><strong className="text-gray-900">Rectification</strong> — corriger des données inexactes</li>
            <li><strong className="text-gray-900">Effacement</strong> — demander la suppression de vos données («&nbsp;droit à l'oubli&nbsp;»)</li>
            <li><strong className="text-gray-900">Portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong className="text-gray-900">Opposition</strong> — vous opposer à certains traitements</li>
            <li><strong className="text-gray-900">Limitation</strong> — limiter le traitement de vos données</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:hello@adorable.click" className="text-violet-600 hover:underline">
              hello@adorable.click
            </a>
            . Vous disposez également du droit d'introduire une réclamation auprès de la{" "}
            <strong className="text-gray-900">CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) à l'adresse{" "}
            <a href="https://www.cnil.fr" className="text-violet-600 hover:underline" target="_blank" rel="noopener">
              cnil.fr
            </a>
            .
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du service :</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Cookies de session d'authentification (Supabase)</li>
            <li>Préférences d'interface (thème clair/sombre)</li>
          </ul>
          <p>Nous n'utilisons pas de cookies publicitaires ni de traceurs tiers à des fins de ciblage commercial.</p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, accès restreints, mots de passe hashés (bcrypt via Supabase Auth). Aucun système n'est infaillible ; en cas de violation de données vous concernant, nous vous en informerons dans les délais légaux.
          </p>
        </Section>

        <Section title="9. Modifications">
          <p>
            Nous pouvons mettre à jour cette politique. En cas de changement substantiel, vous en serez informé par e-mail ou via une notification dans l'application. La date de dernière mise à jour figure en haut de cette page.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Pour toute question relative à la protection de vos données :{" "}
            <a href="mailto:hello@adorable.click" className="text-violet-600 hover:underline">
              hello@adorable.click
            </a>
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-950 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm text-gray-950">adorable</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-gray-700 transition-colors">CGU</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Confidentialité</Link>
            <a href="mailto:hello@adorable.click" className="hover:text-gray-700 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400">© 2025 Adorable · Fait en France</p>
        </div>
      </footer>
    </div>
  );
}

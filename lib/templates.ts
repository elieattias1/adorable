import type { SiteSchema } from '@/types/site-schema'

export interface Template {
  id: string
  label: string
  emoji: string
  desc: string
  schema: SiteSchema
}

export const TEMPLATES: Template[] = [
  {
    id: 'saas',
    label: 'SaaS',
    emoji: '⚡',
    desc: 'Landing produit moderne',
    schema: {
      meta: { title: 'MonSaaS', primaryColor: '#7c3aed', darkMode: true, fontStyle: 'sans' },
      nav: { logo: 'MonSaaS', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }], cta: { label: 'Démarrer', href: '#' } },
      sections: [
        { type: 'hero', id: 'hero', badge: 'Nouveau · v2.0', title: 'Le meilleur outil pour votre équipe', subtitle: 'Automatisez vos workflows, collaborez en temps réel et livrez plus vite.', ctaLabel: 'Essai gratuit 14 jours', ctaHref: '#', secondaryCtaLabel: 'Voir la démo', secondaryCtaHref: '#' },
        { type: 'stats', id: 'stats', items: [{ value: '10k+', label: 'Équipes actives' }, { value: '99.9%', label: 'Uptime' }, { value: '2min', label: 'Setup moyen' }, { value: '4.9★', label: 'Note moyenne' }] },
        { type: 'features', id: 'features', title: 'Tout ce dont vous avez besoin', subtitle: 'Une plateforme complète pour votre productivité.', columns: 3, items: [
          { icon: '🚀', title: 'Déploiement instantané', desc: 'Mettez en production en un clic, sans configuration complexe.' },
          { icon: '🔒', title: 'Sécurité enterprise', desc: 'Chiffrement de bout en bout et conformité SOC 2 Type II.' },
          { icon: '📊', title: 'Analytics avancés', desc: 'Tableaux de bord en temps réel pour toutes vos métriques.' },
          { icon: '🤝', title: 'Collaboration', desc: 'Travaillez ensemble avec permissions granulaires.' },
          { icon: '🔌', title: '200+ intégrations', desc: 'Connectez vos outils préférés en quelques minutes.' },
          { icon: '🎯', title: 'Automatisation', desc: 'Créez des workflows puissants sans coder.' },
        ]},
        { type: 'testimonials', id: 'testimonials', title: 'Ils nous font confiance', items: [
          { name: 'Sophie M.', role: 'CTO @ StartupX', text: 'On a réduit notre temps de déploiement de 70%. Indispensable.', rating: 5 },
          { name: 'Thomas R.', role: 'Lead Dev @ Agence', text: 'L\'intégration avec notre stack existante a pris 20 minutes.', rating: 5 },
          { name: 'Camille D.', role: 'Product Manager', text: 'Les analytics nous ont permis de prendre de meilleures décisions.', rating: 5 },
        ]},
        { type: 'pricing', id: 'pricing', title: 'Tarifs simples et transparents', subtitle: 'Pas de surprise. Changez de plan quand vous voulez.', plans: [
          { name: 'Starter', price: 'Gratuit', desc: 'Pour les petites équipes', features: ['3 projets', '5 utilisateurs', '10GB stockage', 'Support email'], ctaLabel: 'Commencer' },
          { name: 'Pro', price: '29€', period: 'mois', desc: 'Pour les équipes en croissance', features: ['Projets illimités', '25 utilisateurs', '100GB stockage', 'Support prioritaire', 'Analytics avancés'], highlighted: true, ctaLabel: 'Essai 14 jours' },
          { name: 'Enterprise', price: 'Sur devis', desc: 'Pour les grandes organisations', features: ['Tout illimité', 'SSO / SAML', 'SLA 99.99%', 'Account manager', 'Audit logs'], ctaLabel: 'Nous contacter' },
        ]},
        { type: 'faq', id: 'faq', title: 'Questions fréquentes', items: [
          { q: 'Y a-t-il un engagement ?', a: 'Non, vous pouvez annuler à tout moment sans frais.' },
          { q: 'Puis-je changer de plan ?', a: 'Oui, vous pouvez upgrader ou downgrader à n\'importe quel moment.' },
          { q: 'Mes données sont-elles sécurisées ?', a: 'Vos données sont chiffrées et hébergées en Europe (RGPD).' },
        ]},
        { type: 'cta', id: 'cta', title: 'Prêt à aller plus loin ?', subtitle: 'Rejoignez 10 000 équipes qui font confiance à MonSaaS.', ctaLabel: 'Démarrer gratuitement', ctaHref: '#' },
      ],
      footer: { text: '© 2025 MonSaaS. Tous droits réservés.', links: [{ label: 'Confidentialité', href: '#' }, { label: 'CGU', href: '#' }] },
    },
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    desc: 'Menu & réservation',
    schema: {
      meta: { title: 'Le Bistrot', primaryColor: '#b45309', bgColor: '#1a1008', darkMode: true, fontStyle: 'serif' },
      nav: { logo: 'Le Bistrot', links: [{ label: 'Menu', href: '#menu' }, { label: 'Galerie', href: '#galerie' }, { label: 'Réservation', href: '#reservation' }], cta: { label: 'Réserver', href: '#reservation' } },
      sections: [
        { type: 'hero', id: 'hero', badge: 'Ouvert ce soir', title: 'Une cuisine du terroir, réinventée', subtitle: 'Saveurs authentiques, produits locaux, ambiance chaleureuse. À deux pas du centre-ville.', ctaLabel: 'Réserver une table', ctaHref: '#reservation', secondaryCtaLabel: 'Voir le menu', secondaryCtaHref: '#menu' },
        { type: 'stats', id: 'stats', items: [{ value: '12ans', label: 'd\'expérience' }, { value: '4.8★', label: 'sur Google' }, { value: '100%', label: 'produits locaux' }, { value: '35', label: 'couverts' }] },
        { type: 'features', id: 'menu', title: 'Notre menu du moment', subtitle: 'Suggestions de la semaine, selon la saison.', columns: 2, items: [
          { icon: '🥗', title: 'Entrées (12-16€)', desc: 'Tartare de betterave, burrata fermière — Velouté de potiron, huile de truffe — Foie gras maison, pain brioché.' },
          { icon: '🥩', title: 'Plats (24-38€)', desc: 'Côte de bœuf Aubrac, frites maison — Filet de bar, risotto citron — Magret de canard, réduction porto.' },
          { icon: '🍰', title: 'Desserts (9-13€)', desc: 'Fondant au chocolat Valrhona — Tarte tatin, glace vanille — Crème brûlée à la lavande.' },
          { icon: '🍷', title: 'Vins & Accords', desc: 'Sélection de 80 références françaises. Sommelier disponible pour vous conseiller.' },
        ]},
        { type: 'gallery', id: 'galerie', title: 'L\'atmosphère du Bistrot', items: [
          { color: '#7c3a1a', emoji: '🕯️', label: 'Salle principale' },
          { color: '#1a3a1a', emoji: '🌿', label: 'Terrasse' },
          { color: '#3a1a3a', emoji: '🍷', label: 'Cave à vins' },
          { color: '#1a1a3a', emoji: '👨‍🍳', label: 'En cuisine' },
        ]},
        { type: 'testimonials', id: 'avis', title: 'Ce que disent nos clients', items: [
          { name: 'Marie L.', role: 'Cliente fidèle', text: 'Le meilleur restaurant de la ville, sans hésitation. La côte de bœuf est exceptionnelle.', rating: 5 },
          { name: 'Pierre D.', text: 'Accueil chaleureux, service parfait et cuisine remarquable. On reviendra !', rating: 5 },
          { name: 'Julie R.', role: 'Critique gastronomique', text: 'Une adresse qui mérite vraiment le détour. Produits du terroir sublimés.', rating: 5 },
        ]},
        { type: 'contact', id: 'reservation', title: 'Réserver une table', subtitle: 'Ou appelez-nous directement — nous confirmons sous 2h.', phone: '+33 1 23 45 67 89', address: '12 rue des Artisans, 75011 Paris', email: 'reservation@lebistrot.fr', showForm: true },
      ],
      footer: { text: 'Le Bistrot · 12 rue des Artisans, Paris · Ouvert Mar-Sam 12h-14h30 / 19h-22h30' },
    },
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    emoji: '🎨',
    desc: 'Créatif & personnel',
    schema: {
      meta: { title: 'Alex Durand', primaryColor: '#06b6d4', darkMode: true, fontStyle: 'sans' },
      nav: { logo: 'Alex D.', links: [{ label: 'Projets', href: '#projets' }, { label: 'À propos', href: '#about' }, { label: 'Contact', href: '#contact' }], cta: { label: 'Me contacter', href: '#contact' } },
      sections: [
        { type: 'hero', id: 'hero', badge: 'Disponible pour freelance', title: 'Designer UI/UX & Développeur Front-end', subtitle: 'Je crée des interfaces qui allient esthétique et performance. 6 ans d\'expérience, 40+ projets livrés.', ctaLabel: 'Voir mes projets', ctaHref: '#projets', secondaryCtaLabel: 'Télécharger CV', secondaryCtaHref: '#' },
        { type: 'stats', id: 'stats', items: [{ value: '40+', label: 'Projets livrés' }, { value: '6ans', label: 'D\'expérience' }, { value: '98%', label: 'Clients satisfaits' }, { value: '15', label: 'Awards' }] },
        { type: 'features', id: 'projets', title: 'Projets récents', subtitle: 'Une sélection de mes dernières réalisations.', columns: 3, items: [
          { icon: '🛍️', title: 'E-commerce Luxe', desc: 'Refonte complète UX/UI pour une maison de mode parisienne. +40% de conversion.' },
          { icon: '📱', title: 'App Mobile FinTech', desc: 'Design system et prototypage pour une startup de paiement. Lancée sur iOS & Android.' },
          { icon: '🏥', title: 'Plateforme Santé', desc: 'Dashboard médical pour 200 praticiens. Accessibilité WCAG 2.1 AA.' },
          { icon: '🎵', title: 'Streaming Musical', desc: 'Interface de découverte musicale avec algo de recommandation visuelle.' },
          { icon: '🏗️', title: 'SaaS B2B', desc: 'Design et intégration d\'une plateforme de gestion de chantiers.' },
          { icon: '🌍', title: 'ONG Environnement', desc: 'Site vitrine et collecte de dons. Taux de don augmenté de 60%.' },
        ]},
        { type: 'team', id: 'about', title: 'À propos', members: [
          { name: 'Alex Durand', role: 'Designer & Développeur', bio: 'Passionné par l\'intersection du design et de la technologie. Formé à l\'ENSAD, j\'ai travaillé avec des startups et des grandes marques.', emoji: '👨‍💻', color: '#06b6d422' },
        ]},
        { type: 'features', id: 'skills', title: 'Compétences', columns: 4, items: [
          { icon: '🎨', title: 'Figma', desc: 'Design & prototypage' },
          { icon: '⚛️', title: 'React', desc: 'Interfaces modernes' },
          { icon: '🎭', title: 'Motion', desc: 'Animations & transitions' },
          { icon: '📐', title: 'Design System', desc: 'Composants réutilisables' },
        ]},
        { type: 'contact', id: 'contact', title: 'Travaillons ensemble', subtitle: 'Disponible pour des missions freelance ou un poste full-time.', email: 'alex@alexdurand.fr', showForm: true },
      ],
      footer: { text: '© 2025 Alex Durand · Made with ☕', links: [{ label: 'LinkedIn', href: '#' }, { label: 'GitHub', href: '#' }, { label: 'Dribbble', href: '#' }] },
    },
  },
  {
    id: 'agency',
    label: 'Agence',
    emoji: '🏢',
    desc: 'Agence & cabinet pro',
    schema: {
      meta: { title: 'Studio Nova', primaryColor: '#10b981', darkMode: true, fontStyle: 'sans' },
      nav: { logo: 'Studio Nova', links: [{ label: 'Services', href: '#services' }, { label: 'Équipe', href: '#equipe' }, { label: 'Contact', href: '#contact' }], cta: { label: 'Demander un devis', href: '#contact' } },
      sections: [
        { type: 'hero', id: 'hero', title: 'Nous transformons vos idées en produits digitaux', subtitle: 'Stratégie, design et développement — une agence full-stack pour votre croissance.', ctaLabel: 'Démarrer un projet', ctaHref: '#contact', secondaryCtaLabel: 'Nos références', secondaryCtaHref: '#services' },
        { type: 'stats', id: 'stats', items: [{ value: '8ans', label: 'd\'expertise' }, { value: '120+', label: 'Projets livrés' }, { value: '35', label: 'Clients actifs' }, { value: '12', label: 'Experts' }] },
        { type: 'features', id: 'services', title: 'Nos services', subtitle: 'Une offre complète pour votre transformation digitale.', columns: 3, items: [
          { icon: '🎯', title: 'Stratégie digitale', desc: 'Audit, roadmap et conseil pour aligner votre digital avec vos objectifs business.' },
          { icon: '🎨', title: 'Design UX/UI', desc: 'Interfaces intuitives et identités visuelles qui marquent les esprits.' },
          { icon: '⚙️', title: 'Développement', desc: 'Applications web et mobiles performantes, scalables et sécurisées.' },
          { icon: '📈', title: 'Marketing digital', desc: 'SEO, SEA, réseaux sociaux — visibilité et acquisition de leads qualifiés.' },
          { icon: '☁️', title: 'Cloud & DevOps', desc: 'Infrastructure moderne, CI/CD, monitoring et sécurité.' },
          { icon: '🔄', title: 'Maintenance & Support', desc: 'SLA garanti, monitoring 24/7 et évolutions continues.' },
        ]},
        { type: 'team', id: 'equipe', title: 'Notre équipe', members: [
          { name: 'Claire Fontaine', role: 'CEO & Stratégie', emoji: '👩‍💼', color: '#10b98122' },
          { name: 'Marc Lefebvre', role: 'CTO', emoji: '👨‍💻', color: '#3b82f622' },
          { name: 'Inès Berger', role: 'Lead Designer', emoji: '👩‍🎨', color: '#f59e0b22' },
          { name: 'Thomas Petit', role: 'Dev Lead', emoji: '👨‍🔧', color: '#ef444422' },
        ]},
        { type: 'testimonials', id: 'avis', title: 'Ils nous font confiance', items: [
          { name: 'DirCom, Grand Groupe', text: 'Studio Nova a livré notre refonte en 3 mois. Qualité et respect des délais irréprochables.', rating: 5 },
          { name: 'Fondateur, Scale-up', text: 'L\'équipe a su comprendre nos enjeux métier et proposer des solutions vraiment innovantes.', rating: 5 },
          { name: 'DSI, ETI Industrielle', text: 'Partenaire de confiance depuis 4 ans. Réactivité et expertise au rendez-vous.', rating: 5 },
        ]},
        { type: 'contact', id: 'contact', title: 'Parlons de votre projet', subtitle: 'Réponse sous 24h. Premier échange gratuit et sans engagement.', email: 'hello@studionova.fr', phone: '+33 1 42 00 00 00', showForm: true },
      ],
      footer: { text: '© 2025 Studio Nova · Paris · hello@studionova.fr', links: [{ label: 'Mentions légales', href: '#' }, { label: 'LinkedIn', href: '#' }] },
    },
  },
]

// ---------------------------------------------------------------------------
// FPAS POC — lightweight, dependency-free i18n for the core interface.
//
// Scope (POC): navigation, page headers, primary buttons, the accessibility
// menu, view/tab switchers and Settings labels are translated. Dynamic content
// — sample shipment data and AI-drafted text — stays in its source language,
// since that is data rather than interface chrome.
//
// Add a language by extending Lang + LANGS and filling each DICT entry. Any
// missing string falls back to English, so a partial translation never breaks.
// ---------------------------------------------------------------------------

export type Lang = "en" | "nl" | "de" | "fr" | "es";

export const LANGS: { id: Lang; label: string; native: string; flag: string }[] = [
  { id: "en", label: "English", native: "English", flag: "🇬🇧" },
  { id: "nl", label: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { id: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
  { id: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { id: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
];

export const DEFAULT_LANG: Lang = "en";

type Entry = Record<Lang, string>;

// Keyed en/nl/de/fr/es. Keep keys dot-namespaced by area.
export const DICT: Record<string, Entry> = {
  // — App shell —
  "banner.poc": {
    en: "Proof of concept · mock data only · no live regulatory or airline integrations",
    nl: "Proof of concept · alleen testdata · geen live overheids- of luchtvaartkoppelingen",
    de: "Proof of Concept · nur Testdaten · keine Live-Behörden- oder Airline-Anbindungen",
    fr: "Preuve de concept · données fictives uniquement · aucune intégration réglementaire ou aérienne en direct",
    es: "Prueba de concepto · solo datos ficticios · sin integraciones regulatorias ni de aerolíneas en vivo",
  },
  "nav.dashboard": {
    en: "Dashboard",
    nl: "Dashboard",
    de: "Dashboard",
    fr: "Tableau de bord",
    es: "Panel",
  },
  "nav.new": {
    en: "New booking",
    nl: "Nieuwe boeking",
    de: "Neue Buchung",
    fr: "Nouvelle réservation",
    es: "Nueva reserva",
  },
  "nav.staffing": {
    en: "Staffing",
    nl: "Personeel",
    de: "Personal",
    fr: "Personnel",
    es: "Personal",
  },
  "nav.copilot": {
    en: "Copilot",
    nl: "Copilot",
    de: "Copilot",
    fr: "Copilote",
    es: "Copiloto",
  },
  "nav.guide": {
    en: "How it works",
    nl: "Hoe het werkt",
    de: "So funktioniert’s",
    fr: "Comment ça marche",
    es: "Cómo funciona",
  },
  "nav.requirements": {
    en: "Requirements",
    nl: "Vereisten",
    de: "Anforderungen",
    fr: "Exigences",
    es: "Requisitos",
  },
  "action.takeTour": {
    en: "Take a tour",
    nl: "Rondleiding",
    de: "Tour starten",
    fr: "Visite guidée",
    es: "Ver recorrido",
  },
  "tag.liveAI": {
    en: "live AI",
    nl: "live AI",
    de: "Live-KI",
    fr: "IA en direct",
    es: "IA en vivo",
  },

  // — Accessibility menu —
  "a11y.title": {
    en: "Accessibility",
    nl: "Toegankelijkheid",
    de: "Barrierefreiheit",
    fr: "Accessibilité",
    es: "Accesibilidad",
  },
  "a11y.largerText": {
    en: "Larger text",
    nl: "Grotere tekst",
    de: "Größerer Text",
    fr: "Texte plus grand",
    es: "Texto más grande",
  },
  "a11y.largerTextDesc": {
    en: "Scale the whole interface up",
    nl: "Vergroot de hele interface",
    de: "Gesamte Oberfläche vergrößern",
    fr: "Agrandir toute l’interface",
    es: "Ampliar toda la interfaz",
  },
  "a11y.highContrast": {
    en: "High contrast",
    nl: "Hoog contrast",
    de: "Hoher Kontrast",
    fr: "Contraste élevé",
    es: "Alto contraste",
  },
  "a11y.highContrastDesc": {
    en: "Stronger text and borders",
    nl: "Sterkere tekst en randen",
    de: "Stärkerer Text und Ränder",
    fr: "Texte et bordures plus marqués",
    es: "Texto y bordes más marcados",
  },
  "a11y.language": {
    en: "Language",
    nl: "Taal",
    de: "Sprache",
    fr: "Langue",
    es: "Idioma",
  },
  "a11y.languageDesc": {
    en: "Set the portal language",
    nl: "Stel de portaaltaal in",
    de: "Portalsprache festlegen",
    fr: "Définir la langue du portail",
    es: "Establecer el idioma del portal",
  },

  // — Dashboard —
  "dash.kicker": {
    en: "Import jobs · Amsterdam Schiphol",
    nl: "Importopdrachten · Amsterdam Schiphol",
    de: "Import-Aufträge · Amsterdam Schiphol",
    fr: "Dossiers d’importation · Amsterdam Schiphol",
    es: "Trabajos de importación · Ámsterdam Schiphol",
  },
  "dash.title": {
    en: "Live-animal import control",
    nl: "Beheer van levende-dierenimport",
    de: "Steuerung des Lebendtier-Imports",
    fr: "Contrôle des importations d’animaux vivants",
    es: "Control de importación de animales vivos",
  },
  "dash.subtitle": {
    en: "Every shipment tracked against the regulatory sequence. Open a job to run AI extraction, check readiness, and draft documents.",
    nl: "Elke zending wordt gevolgd volgens de wettelijke procedure. Open een opdracht voor AI-extractie, gereedheidscontrole en documentconcepten.",
    de: "Jede Sendung wird entlang der behördlichen Abfolge verfolgt. Öffnen Sie einen Auftrag für KI-Extraktion, Bereitschaftsprüfung und Dokumententwürfe.",
    fr: "Chaque expédition suivie selon la séquence réglementaire. Ouvrez un dossier pour l’extraction IA, la vérification et les brouillons de documents.",
    es: "Cada envío se controla según la secuencia regulatoria. Abra un trabajo para la extracción con IA, la comprobación y los borradores de documentos.",
  },
  "view.jobs": {
    en: "Jobs",
    nl: "Opdrachten",
    de: "Aufträge",
    fr: "Dossiers",
    es: "Trabajos",
  },
  "view.calendar": {
    en: "Calendar",
    nl: "Kalender",
    de: "Kalender",
    fr: "Calendrier",
    es: "Calendario",
  },
  "view.insights": {
    en: "Insights",
    nl: "Inzichten",
    de: "Einblicke",
    fr: "Analyses",
    es: "Análisis",
  },
  "view.report": {
    en: "Report",
    nl: "Rapport",
    de: "Bericht",
    fr: "Rapport",
    es: "Informe",
  },
  "view.bin": {
    en: "Bin",
    nl: "Prullenbak",
    de: "Papierkorb",
    fr: "Corbeille",
    es: "Papelera",
  },
  "layout.list": {
    en: "List",
    nl: "Lijst",
    de: "Liste",
    fr: "Liste",
    es: "Lista",
  },
  "layout.board": {
    en: "Board",
    nl: "Bord",
    de: "Board",
    fr: "Tableau",
    es: "Tablero",
  },
  "layout.grid": {
    en: "Grid",
    nl: "Raster",
    de: "Raster",
    fr: "Grille",
    es: "Cuadrícula",
  },

  // — Copilot —
  "copilot.eyebrow": {
    en: "AI Copilot",
    nl: "AI-copilot",
    de: "KI-Copilot",
    fr: "Copilote IA",
    es: "Copiloto de IA",
  },
  "copilot.title": {
    en: "Ask your operations",
    nl: "Vraag het uw operatie",
    de: "Fragen Sie Ihren Betrieb",
    fr: "Interrogez vos opérations",
    es: "Consulte sus operaciones",
  },
  "copilot.subtitle": {
    en: "Ask about the current shipments or have the assistant draft text. It only sees the jobs in this workspace — a decision-support tool, not an autonomous agent.",
    nl: "Stel vragen over de huidige zendingen of laat de assistent tekst opstellen. Hij ziet alleen de opdrachten in deze werkruimte — een hulpmiddel voor besluitvorming, geen autonome agent.",
    de: "Fragen Sie zu den aktuellen Sendungen oder lassen Sie den Assistenten Texte entwerfen. Er sieht nur die Aufträge in diesem Arbeitsbereich — ein Entscheidungshilfe-Werkzeug, kein autonomer Agent.",
    fr: "Posez des questions sur les expéditions en cours ou faites rédiger des textes par l’assistant. Il ne voit que les dossiers de cet espace — un outil d’aide à la décision, pas un agent autonome.",
    es: "Pregunte sobre los envíos actuales o pida al asistente que redacte textos. Solo ve los trabajos de este espacio — una herramienta de apoyo a la decisión, no un agente autónomo.",
  },
  "copilot.placeholder": {
    en: "Ask about your shipments…  (Enter to send)",
    nl: "Vraag over uw zendingen…  (Enter om te versturen)",
    de: "Fragen Sie zu Ihren Sendungen…  (Enter zum Senden)",
    fr: "Posez une question sur vos expéditions…  (Entrée pour envoyer)",
    es: "Pregunte sobre sus envíos…  (Enter para enviar)",
  },
  "copilot.ask": {
    en: "Ask",
    nl: "Vraag",
    de: "Fragen",
    fr: "Demander",
    es: "Preguntar",
  },

  // — Staffing —
  "staff.eyebrow": {
    en: "Staff planning",
    nl: "Personeelsplanning",
    de: "Personalplanung",
    fr: "Planification du personnel",
    es: "Planificación de personal",
  },
  "staff.title": {
    en: "Roster & availability",
    nl: "Rooster & beschikbaarheid",
    de: "Dienstplan & Verfügbarkeit",
    fr: "Planning et disponibilité",
    es: "Cuadrante y disponibilidad",
  },
  "staff.subtitle": {
    en: "Who’s working, off, on leave or sick — and who’s free to cover a shipment. (Demo data, stored in your browser.)",
    nl: "Wie werkt, vrij is, met verlof of ziek is — en wie een zending kan opvangen. (Demodata, opgeslagen in uw browser.)",
    de: "Wer arbeitet, frei, im Urlaub oder krank ist — und wer eine Sendung übernehmen kann. (Demodaten, im Browser gespeichert.)",
    fr: "Qui travaille, est en repos, en congé ou malade — et qui peut couvrir une expédition. (Données de démo, dans votre navigateur.)",
    es: "Quién trabaja, libra, está de baja o enfermo — y quién puede cubrir un envío. (Datos de demo, en su navegador.)",
  },
  "staff.tab.roster": {
    en: "Roster",
    nl: "Rooster",
    de: "Dienstplan",
    fr: "Planning",
    es: "Cuadrante",
  },
  "staff.tab.leave": {
    en: "Leave",
    nl: "Verlof",
    de: "Urlaub",
    fr: "Congés",
    es: "Ausencias",
  },
  "staff.tab.resources": {
    en: "Resources",
    nl: "Middelen",
    de: "Ressourcen",
    fr: "Ressources",
    es: "Recursos",
  },
  "staff.tab.import": {
    en: "Import",
    nl: "Importeren",
    de: "Importieren",
    fr: "Importer",
    es: "Importar",
  },

  // — Settings —
  "settings.eyebrow": {
    en: "Settings",
    nl: "Instellingen",
    de: "Einstellungen",
    fr: "Paramètres",
    es: "Ajustes",
  },
  "settings.title": {
    en: "Workspace settings",
    nl: "Werkruimte-instellingen",
    de: "Arbeitsbereich-Einstellungen",
    fr: "Paramètres de l’espace de travail",
    es: "Ajustes del espacio de trabajo",
  },
  "settings.subtitle": {
    en: "Configure this FPAS workspace. (Demo — changes are stored in your browser.)",
    nl: "Configureer deze FPAS-werkruimte. (Demo — wijzigingen worden in uw browser bewaard.)",
    de: "Konfigurieren Sie diesen FPAS-Arbeitsbereich. (Demo — Änderungen werden in Ihrem Browser gespeichert.)",
    fr: "Configurez cet espace FPAS. (Démo — les modifications sont enregistrées dans votre navigateur.)",
    es: "Configure este espacio de FPAS. (Demo — los cambios se guardan en su navegador.)",
  },
  "settings.section.org": {
    en: "Organisation",
    nl: "Organisatie",
    de: "Organisation",
    fr: "Organisation",
    es: "Organización",
  },
  "settings.section.appearance": {
    en: "Appearance",
    nl: "Weergave",
    de: "Darstellung",
    fr: "Apparence",
    es: "Apariencia",
  },
  "settings.section.ai": {
    en: "AI",
    nl: "AI",
    de: "KI",
    fr: "IA",
    es: "IA",
  },
  "settings.section.data": {
    en: "Data",
    nl: "Gegevens",
    de: "Daten",
    fr: "Données",
    es: "Datos",
  },

  // — Requirements —
  "req.title": {
    en: "Requirements & traceability",
    nl: "Vereisten & traceerbaarheid",
    de: "Anforderungen & Rückverfolgbarkeit",
    fr: "Exigences et traçabilité",
    es: "Requisitos y trazabilidad",
  },
};

/** Translate a key into the given language, falling back to English then the key. */
export function translate(lang: Lang, key: string): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}

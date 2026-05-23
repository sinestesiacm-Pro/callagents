import { NextRequest, NextResponse } from "next/server";

// This endpoint generates sales context using AI.
// For production, replace with OpenAI / Claude / Gemini API call.
// Retell.ai LLM is designed for voice conversations, not text completion.

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Template-based generation (replace with real LLM in production)
    const result = generateSalesContext(query);

    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateSalesContext(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes("martinez") || lower.includes("soluzioni") || lower.includes("servizi digitali") || lower.includes("servicios digitales")) {
    return `Contesto per Martinez Soluzioni - Servizi Digitali in Italia:
- Offriamo: sviluppo web, automazione, consulenza digitale, sistemi personalizzati.
- Target: aziende italiane che vogliono digitalizzare processi.
- Punti di forza: made in Italy, assistenza locale, partita IVA italiana.
- Pitch iniziale in italiano: "Buongiorno, sono di Martinez Soluzioni. Aiutiamo aziende italiane a digitalizzare i loro processi. Ha 2 minuti per capire se possiamo esserle utili?"
- Tecnica SPIN da usare: chiedere che software usano oggi, quali processi fanno ancora a mano, quanto tempo perdono, immaginare il risparmio con automazione.
- Obiezioni preparate: "Abbiamo gia un fornitore" → "Capisco. Noi lavoriamo spesso affiancando team esistenti su progetti specifici."`;
  }

  if (lower.includes("crm")) {
    return `Contesto vendita CRM:
- Il cliente cerca ottimizzazione gestione clienti.
- Punti chiave: automazione pipeline vendite, integrazione email/calendario, report in tempo reale.
- ROI tipico: riduzione 30% attivita amministrative.
- Pitch: "Buongiorno, aiutiamo aziende a risparmiare 15 ore a settimana nella gestione clienti. Le interessa?"`;
  }

  if (lower.includes("logistic") || lower.includes("logistica") || lower.includes("logística")) {
    return `Contesto per azienda logistica:
- Focus su efficienza operativa e tracciabilita.
- Integrazioni con sistemi tracking e ERP.
- Esempio concreto: "Un'azienda logistica a Milano ha ridotto i tempi di risposta del 40% con la nostra piattaforma."
- Pitch: "Buongiorno, ottimizziamo la comunicazione tra operations e clienti. Le spiego come in 3 minuti?"`;
  }

  if (lower.includes("ristorante") || lower.includes("restaurante") || lower.includes("hotel") || lower.includes("inventario") || lower.includes("inventario") || lower.includes("fattura") || lower.includes("factura") || lower.includes("foto")) {
    return `CONTESTO PER APP INVENTARIO - RISTORANTI / HOTEL:

PRODOTTO: App di inventario per ristoranti e hotel con ristorante.
FUNZIONAMENTO: Invece di inserire prodotti manualmente, scatti UNA FOTO alla fattura o alla lista della spesa e l'app registra tutto automaticamente.

PITCH DIRETTO (italiano, tono deciso ma cordiale):
"Ciao, sono di Martinez Soluzioni. Ti chiamo per una cosa molto concreta: abbiamo un'app che ti fa risparmiare ore ogni settimana sulla gestione dell'inventario. Invece di scrivere tutto a mano, fai una foto alla fattura e l'app carica tutto da sola. Hai 1 minuto per vedere se ti interessa?"

DOMANDE CHIAVE DA FARE:
1. "Come gestite l'inventario oggi? Carta, Excel, altro software?"
2. "Quanto tempo perdi a settimana a inserire prodotti e fatture?"
3. "Se potessi farlo con una foto, quanto tempo risparmieresti?"

OBIEZIONI PRONTE:
- "Usiamo gia un software" → "Capito. Il nostro e complementare: si integra e ti fa risparmiare il data entry. Facciamo una prova di 30 secondi?"
- "Non ho tempo" → "Lo so, per questo ti chiamo. Proprio per farti risparmiare tempo. 1 minuto?"
- "Non mi interessa" → "Rispetto. Posso mandarti un video di 30 secondi dove si vede come funziona? Cosi se cambia idea sai gia cosa fa."
- "Mandami una mail" → "Certo. Pero dimmi solo una cosa: oggi come fate l'inventario? Cosi ti mando info mirate."

CHIUSURA: NON mandare link. Obiettivo e FISSARE APPUNTAMENTO TELEFONICO.
- Se interessati: "Ti propongo una chiamata di 10 minuti con Carlo, il nostro esperto. Lui ti mostra come funziona su misura per te. Domani mattina o pomeriggio?"
- Se incerti: "Nessun problema. Ti lascio il sito martinezsoluzioni.com. Se cambi idea, richiamaci."
- Se dice si: "Perfetto! Ti confermo l'orario via SMS."

TONO: Diretto, pratico, senza giri di parole. Obiettivo finale: fissare un appuntamento con Carlo. Il sito web e solo il piano B.`;
  }

  if (lower.includes("italia") || lower.includes("italy") || lower.includes("italiano")) {
    return `Contesto per chiamata in Italia:
- Lingua: italiano, voce nativa Andrea.
- Cultura business italiana: relazione personale prima del pitch.
- Apertura: "Buongiorno, parlo con [nome]? Sono [nome] di Martinez Soluzioni."
- GDPR compliant, supporto in orario europeo.
- Chiusura: proporre una demo o invio proposta personalizzata.`;
  }

  return `Contesto per Martinez Soluzioni - Servizi Digitali:
- Azienda italiana di servizi digitali: sviluppo web, automazione, consulenza IT.
- Target: PMI italiane che vogliono digitalizzarsi.
- Vantaggi: fornitore locale, partita IVA italiana, assistenza diretta.
- Pitch: "Buongiorno, sono di Martinez Soluzioni. Aiutiamo aziende a digitalizzare i processi. Ha 2 minuti?"
- Usare SPIN: chiedere processi attuali, punti di dolore, costo del non cambiare, beneficio soluzione.
- Obiezioni pronte: costo, abbiamo gia fornitore, non e priorita.
- Chiusura: proporre consulenza gratuita 30 min per analisi esigenze.`;
}

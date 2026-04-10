// ═══════════════════════════════════════════════════════════════════════════
// aiSummarizer.ts — Bilingual veterinary note summarization (English + Kiswahili)
// Extracts structured SOAP fields from free-text dictation
// ═══════════════════════════════════════════════════════════════════════════

export interface VetNoteSummary {
  complaint: string;
  diagnosis: string;
  treatment: string;
  followUpDate?: string;
  notes?: string;
}

// ─── Bilingual Keyword Maps ─────────────────────────────────────────────────
const COMPLAINT_KEYWORDS: Record<string, string[]> = {
  english: [
    "vomiting", "diarrhea", "limping", "lameness", "coughing", "sneezing",
    "fever", "not eating", "lethargic", "weakness", "wound", "injury",
    "bleeding", "swelling", "pregnant", "due", "labor", "mastitis",
    "eye discharge", "nasal discharge", "difficulty breathing", "bloating",
    "constipation", "skin rash", "ticks", "fleas", "maggots", "fracture"
  ],
  swahili: [
    "kutapika", "kuhara", "kuumia mguu", "kupiga teke", "kukohoa", "kisenya",
    "homa", "kula", "ulemavu", "kuchoka", "jeraha", "majeraha",
    "kutokwa na damu", "kuvimba", "mimba", "kujifungua", "kutoa maziwa",
    "mafunzo ya macho", "mafunzo ya pua", "kushindwa kupumua", "kuvimba tumbo",
    "kukosa haja kubwa", "mashale ya ngozi", "kupe", "flea", "maggot", "kuvunjika mfupa"
  ]
};

const DIAGNOSIS_KEYWORDS: Record<string, string[]> = {
  english: [
    "gastroenteritis", "pneumonia", "mastitis", "ectopic pregnancy", "brucellosis",
    "trypanosomiasis", "anaplasmosis", "babesiosis", "theileriosis", "fmd",
    "foot and mouth", "rabies", "anthrax", "bloat", "acidosis", "ketosis",
    "milk fever", "milk fever", "retained placenta", "uterine prolapse",
    "fracture", "abscess", "wound infection", "tick fever", "worm infestation",
    "coccidiosis", "newcastle disease", "gumboro", "fowl pox", "fowl cholera"
  ],
  swahili: [
    "homa ya tumbo", "pneumonia", "homa ya maziwa", "mimba nje", "brucellosis",
    "trypanosomiasis", "anaplasmosis", "babesiosis", "theileriosis", "homa ya kufura",
    "homa ya mdomo na mguu", "kichaa cha mbwa", "sataniza", "kuvimba tumbo",
    "acidosis", "ketosis", "homa ya maziwa", "kukosa maziwa", "kukaza nyama",
    "kushuka mzazi", "kuvunjika mfupa", "kuvimba", "kufectioni jeraha", "homa ya kupe",
    "minyoo", "coccidiosis", "newcastle", "gumboro", "ndui ya kuku", "tauni"
  ]
};

const TREATMENT_KEYWORDS: Record<string, string[]> = {
  english: [
    "deworming", "vaccination", "antibiotic", "anti-inflammatory", "painkiller",
    "vitamin injection", "mineral supplement", "fluid therapy", "iv drip",
    "castration", "spaying", "dehorning", "wound dressing", "suturing",
    "tetanus toxoid", "antiseptic", "disinfectant", "calcium injection",
    "oxytocin", "progesterone", "c-section", "caesarean"
  ],
  swahili: [
    "dawa ya minyoo", "chanjo", "antibiyotiki", "dawa ya kupunguza kuvimba", "dawa ya maumivu",
    "vitamin", "madini", "kutoa maji", "drip", "kutoa matiti",
    "kutoa figo", "kukata pembe", "kufunga jeraha", "kushona jeraha",
    "chanjo ya kuchoma", "antiseptiki", "dawa ya kuua vijidudu", "calcium",
    "oxytocin", "progesterone", "kukata tumbo", "operation"
  ]
};

const FOLLOW_UP_PATTERNS: RegExp[] = [
  // English patterns
  /(?:follow up|review|check up|next visit|return|see you)\s+(?:in|after|on)?\s*(\d+)?\s*(day|days|week|weeks|month|months)/i,
  /(?:next|come back)\s+(?:in|after)?\s*(\d+)?\s*(day|days|week|weeks|month|months)/i,
  // Kiswahili patterns
  /(?:rudia|rudi|kuja tena|check up|dawa ya pili)\s*(?:baada ya|after)?\s*(\d+)?\s*(siku|wiki|mwezi)/i,
  /(?:siku|wiki|mwezi)\s*(\d+)/i
];

const MEDICATION_DOSE_PATTERN = /(\d+\s*(?:mg|ml|g|kg|cc|units?|tabs?|tablets?))/gi;
const ANIMAL_SPECIES = /(cow|cattle|bull|heifer|calf|goat|sheep|lamb|dog|bitch|puppy|cat|kitten|pig|piglet|horse|foal|donkey|chicken|hen|rooster|duck|turkey|rabbit)/i;

// ─── Helper Functions ──────────────────────────────────────────────────────
function findKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
}

function extractSentencesWithKeywords(text: string, keywords: string[]): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const relevant = sentences.filter(sent => 
    keywords.some(kw => sent.toLowerCase().includes(kw.toLowerCase()))
  );
  return relevant.length > 0 ? relevant.join(". ") : sentences.slice(0, 2).join(". ");
}

function extractFollowUpDate(text: string): string | undefined {
  for (const pattern of FOLLOW_UP_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const num = match[1] ? parseInt(match[1]) : 7; // default 7 days
      const unit = (match[2] || "days").toLowerCase();
      
      let daysToAdd = num;
      if (unit.startsWith("week")) daysToAdd = num * 7;
      if (unit.startsWith("month") || unit === "mwezi") daysToAdd = num * 30;
      if (unit === "siku") daysToAdd = num;
      if (unit === "wiki") daysToAdd = num * 7;
      
      const date = new Date();
      date.setDate(date.getDate() + daysToAdd);
      return date.toISOString().split("T")[0];
    }
  }
  return undefined;
}

function extractMedicationDoses(text: string): string {
  const doses = text.match(MEDICATION_DOSE_PATTERN);
  return doses ? doses.join(", ") : "";
}

// ─── Main Summarization Function ────────────────────────────────────────────
export function summarizeVetNote(transcript: string): VetNoteSummary {
  if (!transcript || transcript.trim().length < 10) {
    return {
      complaint: "General checkup",
      diagnosis: "Pending examination",
      treatment: "To be determined",
      notes: transcript
    };
  }

  const lowerTranscript = transcript.toLowerCase();
  
  // Extract complaints
  const enComplaints = findKeywords(transcript, COMPLAINT_KEYWORDS.english);
  const swComplaints = findKeywords(transcript, COMPLAINT_KEYWORDS.swahili);
  const allComplaints = [...enComplaints, ...swComplaints];
  
  // Extract diagnoses
  const enDiagnoses = findKeywords(transcript, DIAGNOSIS_KEYWORDS.english);
  const swDiagnoses = findKeywords(transcript, DIAGNOSIS_KEYWORDS.swahili);
  const allDiagnoses = [...enDiagnoses, ...swDiagnoses];
  
  // Extract treatments
  const enTreatments = findKeywords(transcript, TREATMENT_KEYWORDS.english);
  const swTreatments = findKeywords(transcript, TREATMENT_KEYWORDS.swahili);
  const allTreatments = [...enTreatments, ...swTreatments];
  
  // Build structured fields
  let complaint: string;
  if (allComplaints.length > 0) {
    complaint = allComplaints.slice(0, 3).join(", ");
  } else {
    // Extract first sentence mentioning animal condition
    const sentences = transcript.split(/[.!?]+/);
    complaint = sentences[0]?.trim() || "General checkup";
    if (complaint.length > 100) complaint = complaint.slice(0, 100) + "...";
  }
  
  let diagnosis: string;
  if (allDiagnoses.length > 0) {
    diagnosis = allDiagnoses.slice(0, 2).join("; ");
  } else {
    // Try to infer from complaints
    const complaintText = allComplaints.join(" ");
    if (complaintText.includes("fever") || complaintText.includes("homa")) {
      diagnosis = "Pyrexia of unknown origin - investigate further";
    } else if (complaintText.includes("vomit") || complaintText.includes("tapika")) {
      diagnosis = "Gastrointestinal disturbance";
    } else if (complaintText.includes("limp") || complaintText.includes("mguu")) {
      diagnosis = "Musculoskeletal injury";
    } else {
      diagnosis = "Clinical examination required";
    }
  }
  
  let treatment: string;
  if (allTreatments.length > 0) {
    const doses = extractMedicationDoses(transcript);
    treatment = allTreatments.slice(0, 3).join(", ");
    if (doses) treatment += ` (${doses})`;
  } else {
    treatment = "Supportive care; monitor closely";
  }
  
  // Extract follow-up date
  const followUpDate = extractFollowUpDate(transcript);
  
  // Build notes summary
  const relevantSentences = extractSentencesWithKeywords(
    transcript, 
    [...allComplaints, ...allDiagnoses, ...allTreatments]
  );
  
  return {
    complaint,
    diagnosis,
    treatment,
    followUpDate,
    notes: relevantSentences || transcript.slice(0, 200)
  };
}

// ─── SOAP Note Formatter ───────────────────────────────────────────────────
export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export function formatAsSOAP(summary: VetNoteSummary): SOAPNote {
  return {
    subjective: summary.complaint,
    objective: "Physical examination findings documented",
    assessment: summary.diagnosis,
    plan: summary.treatment + (summary.followUpDate ? `; Follow-up: ${summary.followUpDate}` : "")
  };
}

// ─── Mock AI Processing (for demo when Web Speech unavailable) ──────────────
export function mockProcessTranscript(): string {
  const mockNotes = [
    "Cow presenting with fever and reduced appetite for two days. Suspect anaplasmosis based on pale mucous membranes. Treatment: Oxytetracycline 10 mg per kg intramuscular, B complex injection, and mineral supplement. Follow up in five days.",
    "Goat has mastitis in right udder quarter. Milk is clotted and foul smelling. Treatment: Intramammary antibiotic infusion, anti-inflammatory injection, strip quarter three times daily. Follow up in three days.",
    "Dog vomiting and diarrhea since morning, lethargic. Possible gastroenteritis. Treatment: Oral rehydration salts, kaolin mixture, withhold food for 12 hours. Review tomorrow if no improvement.",
    "Heifer with dystocia, calf presented in posterior position. Corrected position, delivered live calf. Postpartum care: Oxytocin injection, calcium injection, monitor for retained placenta. Check in two days."
  ];
  return mockNotes[Math.floor(Math.random() * mockNotes.length)];
}

export default summarizeVetNote;

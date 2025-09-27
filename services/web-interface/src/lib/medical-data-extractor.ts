/**
 * Medical Data Extractor - Extracts structured medical information from AI responses
 * This ensures we capture comprehensive medical data even when AI service doesn't provide structured output
 */

interface ExtractedMedicalData {
  symptoms: string[];
  symptom_duration?: string;
  symptom_severity?: 'mild' | 'moderate' | 'severe';
  symptom_onset?: string;
  primary_concern?: string;
  differential_diagnosis: string[];
  vital_signs?: {
    temperature?: string;
    blood_pressure?: string;
    heart_rate?: string;
    respiratory_rate?: string;
  };
  reported_pain_level?: number;
  relevant_medical_history: string[];
  current_medications_mentioned: string[];
  allergies_mentioned: string[];
  family_history_relevant: string[];
  suggested_tests: string[];
  red_flags: string[];
  when_to_seek_immediate_care: string[];
  pre_appointment_instructions: string[];
  knowledge_base_references: string[];
  clinical_guidelines_used: string[];
}

export class MedicalDataExtractor {
  private static symptomKeywords = [
    'pain', 'ache', 'fever', 'cough', 'headache', 'nausea', 'vomiting', 'diarrhea', 'fatigue', 'weakness',
    'dizzy', 'shortness of breath', 'chest pain', 'abdominal pain', 'back pain', 'rash', 'itching',
    'swelling', 'numbness', 'tingling', 'blurred vision', 'difficulty breathing', 'palpitations'
  ];

  private static durationPatterns = [
    /(\d+)\s*(day|week|month|year|hour|minute)s?/gi,
    /since\s+(yesterday|today|last\s+week|last\s+month)/gi,
    /(suddenly|gradually|slowly|recently|for\s+a\s+while)/gi
  ];

  private static severityPatterns = [
    { pattern: /severe|intense|excruciating|unbearable|very\s+bad/gi, level: 'severe' as const },
    { pattern: /moderate|medium|manageable|noticeable/gi, level: 'moderate' as const },
    { pattern: /mild|slight|minor|little|barely/gi, level: 'mild' as const }
  ];

  private static vitalSignsPatterns = {
    temperature: /temperature.*?(\d+(?:\.\d+)?)\s*°?[CF]?/gi,
    blood_pressure: /blood\s*pressure.*?(\d+\/\d+)/gi,
    heart_rate: /heart\s*rate.*?(\d+)\s*bpm/gi,
    respiratory_rate: /respiratory\s*rate.*?(\d+)/gi
  };

  private static painLevelPattern = /pain.*?(?:level|scale|rating|score).*?(\d+)(?:\/10|out\s+of\s+10)?/gi;

  private static medicationPatterns = [
    /taking\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi,
    /medication[s]?.*?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi,
    /prescribed\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi
  ];

  private static allergyPatterns = [
    /allergic\s+to\s+([a-zA-Z\s,]+)/gi,
    /allergy.*?([a-zA-Z\s,]+)/gi,
    /allergies.*?([a-zA-Z\s,]+)/gi
  ];

  private static testPatterns = [
    /recommend.*?(?:test|exam|scan|x-ray|blood\s+work|lab|screening)/gi,
    /suggest.*?(?:test|exam|scan|x-ray|blood\s+work|lab|screening)/gi,
    /need.*?(?:test|exam|scan|x-ray|blood\s+work|lab|screening)/gi
  ];

  private static redFlagPatterns = [
    /red\s+flag/gi,
    /warning\s+sign/gi,
    /seek\s+immediate/gi,
    /emergency/gi,
    /urgent/gi,
    /concerning/gi
  ];

  /**
   * Extract comprehensive medical data from AI response text
   */
  static extractMedicalData(
    conversationHistory: Array<{ role: string; content: string }>,
    currentResponse: string,
    existingData?: Partial<ExtractedMedicalData>
  ): ExtractedMedicalData {
    const fullText = [
      ...conversationHistory.map(msg => msg.content),
      currentResponse
    ].join(' ');

    const extracted: ExtractedMedicalData = {
      symptoms: existingData?.symptoms || [],
      differential_diagnosis: existingData?.differential_diagnosis || [],
      relevant_medical_history: existingData?.relevant_medical_history || [],
      current_medications_mentioned: existingData?.current_medications_mentioned || [],
      allergies_mentioned: existingData?.allergies_mentioned || [],
      family_history_relevant: existingData?.family_history_relevant || [],
      suggested_tests: existingData?.suggested_tests || [],
      red_flags: existingData?.red_flags || [],
      when_to_seek_immediate_care: existingData?.when_to_seek_immediate_care || [],
      pre_appointment_instructions: existingData?.pre_appointment_instructions || [],
      knowledge_base_references: existingData?.knowledge_base_references || [],
      clinical_guidelines_used: existingData?.clinical_guidelines_used || [],
      ...existingData
    };

    // Extract symptoms
    extracted.symptoms = this.extractSymptoms(fullText, extracted.symptoms || []);

    // Extract symptom characteristics
    if (!extracted.symptom_duration) {
      extracted.symptom_duration = this.extractDuration(fullText);
    }
    
    if (!extracted.symptom_severity) {
      extracted.symptom_severity = this.extractSeverity(fullText);
    }

    // Extract vital signs
    if (!extracted.vital_signs) {
      extracted.vital_signs = this.extractVitalSigns(fullText);
    }

    // Extract pain level
    if (!extracted.reported_pain_level) {
      extracted.reported_pain_level = this.extractPainLevel(fullText);
    }

    // Extract medications
    const medications = this.extractMedications(fullText);
    extracted.current_medications_mentioned = [
      ...new Set([...(extracted.current_medications_mentioned || []), ...medications])
    ];

    // Extract allergies
    const allergies = this.extractAllergies(fullText);
    extracted.allergies_mentioned = [
      ...new Set([...(extracted.allergies_mentioned || []), ...allergies])
    ];

    // Extract suggested tests
    const tests = this.extractSuggestedTests(currentResponse);
    extracted.suggested_tests = [
      ...new Set([...(extracted.suggested_tests || []), ...tests])
    ];

    // Extract red flags
    const redFlags = this.extractRedFlags(currentResponse);
    extracted.red_flags = [
      ...new Set([...(extracted.red_flags || []), ...redFlags])
    ];

    // Extract emergency care instructions
    const emergencyCare = this.extractEmergencyCare(currentResponse);
    extracted.when_to_seek_immediate_care = [
      ...new Set([...(extracted.when_to_seek_immediate_care || []), ...emergencyCare])
    ];

    // Extract pre-appointment instructions
    const instructions = this.extractPreAppointmentInstructions(currentResponse);
    extracted.pre_appointment_instructions = [
      ...new Set([...(extracted.pre_appointment_instructions || []), ...instructions])
    ];

    // Extract primary concern (most mentioned symptom/condition)
    if (!extracted.primary_concern && (extracted.symptoms || []).length > 0) {
      extracted.primary_concern = this.identifyPrimaryConcern(fullText, extracted.symptoms || []);
    }

    return extracted;
  }

  private static extractSymptoms(text: string, existingSymptoms: string[]): string[] {
    const symptoms = [...existingSymptoms];
    
    this.symptomKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(text) && !symptoms.some(s => s.toLowerCase().includes(keyword.toLowerCase()))) {
        symptoms.push(keyword);
      }
    });

    return symptoms;
  }

  private static extractDuration(text: string): string | undefined {
    for (const pattern of this.durationPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return undefined;
  }

  private static extractSeverity(text: string): 'mild' | 'moderate' | 'severe' | undefined {
    for (const { pattern, level } of this.severityPatterns) {
      if (pattern.test(text)) return level;
    }
    return undefined;
  }

  private static extractVitalSigns(text: string): ExtractedMedicalData['vital_signs'] {
    const vitals: any = {};
    
    Object.entries(this.vitalSignsPatterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        vitals[key] = match[1];
      }
    });

    return Object.keys(vitals).length > 0 ? vitals : undefined;
  }

  private static extractPainLevel(text: string): number | undefined {
    const match = text.match(this.painLevelPattern);
    if (match) {
      const level = parseInt(match[1]);
      return level >= 0 && level <= 10 ? level : undefined;
    }
    return undefined;
  }

  private static extractMedications(text: string): string[] {
    const medications: string[] = [];
    
    this.medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const med = match[1].trim();
        if (med.length > 2 && !medications.includes(med)) {
          medications.push(med);
        }
      }
    });

    return medications;
  }

  private static extractAllergies(text: string): string[] {
    const allergies: string[] = [];
    
    this.allergyPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        const allergyText = match[1].split(',').map(a => a.trim()).filter(a => a.length > 1);
        allergies.push(...allergyText);
      }
    });

    return allergies;
  }

  private static extractSuggestedTests(text: string): string[] {
    const tests: string[] = [];
    const testMatches = text.match(this.testPatterns[0]) || 
                       text.match(this.testPatterns[1]) || 
                       text.match(this.testPatterns[2]);
    
    if (testMatches) {
      testMatches.forEach(match => {
        const testName = match.replace(/^(recommend|suggest|need)\s*/i, '').trim();
        if (testName && !tests.includes(testName)) {
          tests.push(testName);
        }
      });
    }

    return tests;
  }

  private static extractRedFlags(text: string): string[] {
    const redFlags: string[] = [];
    
    this.redFlagPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        // Extract the sentence containing the red flag
        const sentences = text.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (pattern.test(sentence.trim())) {
            redFlags.push(sentence.trim());
          }
        });
      }
    });

    return redFlags;
  }

  private static extractEmergencyCare(text: string): string[] {
    const emergencyInstructions: string[] = [];
    
    const emergencyPatterns = [
      /seek\s+immediate.*?(?:[.!]|$)/gi,
      /go\s+to.*?emergency.*?(?:[.!]|$)/gi,
      /call.*?911.*?(?:[.!]|$)/gi
    ];

    emergencyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        emergencyInstructions.push(...matches);
      }
    });

    return emergencyInstructions;
  }

  private static extractPreAppointmentInstructions(text: string): string[] {
    const instructions: string[] = [];
    
    const instructionPatterns = [
      /before.*?appointment.*?(?:[.!]|$)/gi,
      /prepare.*?visit.*?(?:[.!]|$)/gi,
      /bring.*?(?:with you|to.*?appointment).*?(?:[.!]|$)/gi
    ];

    instructionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        instructions.push(...matches);
      }
    });

    return instructions;
  }

  private static identifyPrimaryConcern(text: string, symptoms: string[]): string | undefined {
    const symptomCounts = symptoms.map(symptom => ({
      symptom,
      count: (text.toLowerCase().match(new RegExp(symptom.toLowerCase(), 'g')) || []).length
    }));

    symptomCounts.sort((a, b) => b.count - a.count);
    return symptomCounts.length > 0 ? symptomCounts[0].symptom : undefined;
  }
}

/**
 * Helper function to merge extracted data with existing consultation data
 */
export function mergeConsultationData(existing: any, extracted: ExtractedMedicalData): any {
  return {
    ...existing,
    
    // Merge symptoms
    symptoms: [...new Set([...(existing.symptoms || []), ...(extracted.symptoms || [])])],
    
    // Update if new data available
    symptom_duration: extracted.symptom_duration || existing.symptom_duration,
    symptom_severity: extracted.symptom_severity || existing.symptom_severity,
    symptom_onset: extracted.symptom_onset || existing.symptom_onset,
    primary_concern: extracted.primary_concern || existing.primary_concern,
    vital_signs: { ...existing.vital_signs, ...extracted.vital_signs },
    reported_pain_level: extracted.reported_pain_level !== undefined ? extracted.reported_pain_level : existing.reported_pain_level,
    
    // Merge arrays
    differential_diagnosis: [...new Set([...(existing.differential_diagnosis || []), ...(extracted.differential_diagnosis || [])])],
    relevant_medical_history: [...new Set([...(existing.relevant_medical_history || []), ...(extracted.relevant_medical_history || [])])],
    current_medications_mentioned: [...new Set([...(existing.current_medications_mentioned || []), ...(extracted.current_medications_mentioned || [])])],
    allergies_mentioned: [...new Set([...(existing.allergies_mentioned || []), ...(extracted.allergies_mentioned || [])])],
    family_history_relevant: [...new Set([...(existing.family_history_relevant || []), ...(extracted.family_history_relevant || [])])],
    suggested_tests: [...new Set([...(existing.suggested_tests || []), ...(extracted.suggested_tests || [])])],
    red_flags: [...new Set([...(existing.red_flags || []), ...(extracted.red_flags || [])])],
    when_to_seek_immediate_care: [...new Set([...(existing.when_to_seek_immediate_care || []), ...(extracted.when_to_seek_immediate_care || [])])],
    pre_appointment_instructions: [...new Set([...(existing.pre_appointment_instructions || []), ...(extracted.pre_appointment_instructions || [])])],
    knowledge_base_references: [...new Set([...(existing.knowledge_base_references || []), ...(extracted.knowledge_base_references || [])])],
    clinical_guidelines_used: [...new Set([...(existing.clinical_guidelines_used || []), ...(extracted.clinical_guidelines_used || [])])]
  };
}
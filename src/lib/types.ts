export interface CanvasElement {
  id: string;
  type: 'text' | 'qr' | 'image';
  fieldKey?: string; // e.g. 'nombre', 'motivo', 'fecha', 'id_certificado'
  content: string;
  x: number; // percentage or px
  y: number;
  width: number;
  height: number;
  // Typography styles
  fontFamily?: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
}

export interface CertificateTemplate {
  id: string;
  name: string;
  backgroundImageUrl: string;
  width: number;
  height: number;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
}

export interface IssuedCertificate {
  id: string; // Unique ID / code for QR
  templateId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  customFields: Record<string, string>;
  issuedAt: string;
  updatedAt: string;
}

export interface SessionPlan {
  id: string;
  title: string;
  teacherName: string;
  grade: string;
  section: string;
  area: string;
  specialty?: string;
  duration?: string;
  date?: string;
  theme: string;
  sourceContent?: string;
  
  // CNEB Core
  competencies: string[];
  capacities: string[];
  performances: string[]; // Desempeños precisados
  evidence: string; // Evidencia de aprendizaje
  instrument: string; // Instrumento de evaluación
  
  // Transversals
  transversalCompetencies: string[];
  transversalCapacities: string[];
  transversalApproaches: string[]; // Enfoques transversales (valores y actitudes)
  
  // Sequence of learning
  sequence: {
    inicio: {
      motivation: string;
      priorKnowledge: string;
      cognitiveConflict: string;
      purpose: string;
      timeMinutes: number;
    };
    desarrollo: {
      activities: string[];
      methodology: string;
      timeMinutes: number;
    };
    cierre: {
      metacognition: string;
      evaluationSummary: string;
      timeMinutes: number;
    };
  };
  
  // Evaluation Rubric
  rubric: {
    criteria: string;
    levels: {
      destacado: string; // AD
      logrado: string;   // A
      enProceso: string; // B
      enInicio: string;  // C
    };
  }[];
  
  // Interactive Assessment for Students
  assessment: {
    instructions: string;
    questions: {
      id: string;
      type: 'multiple_choice' | 'true_false' | 'short_answer';
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
      points: number;
    }[];
  };

  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyConfig {
  keys: string[];
  preferredModel?: string;
}

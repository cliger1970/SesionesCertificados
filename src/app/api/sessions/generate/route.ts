import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithFailover } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, sourceContent, area, grade, teacherName, section, duration } = body;

    if (!theme && !sourceContent) {
      return NextResponse.json({ error: 'Debes proporcionar al menos un tema o un contenido base.' }, { status: 400 });
    }

    const systemInstruction = `Eres un especialista pedagógico del Ministerio de Educación de Perú (MINEDU) y experto en el Currículo Nacional de la Educación Básica (CNEB).
Tu objetivo es diseñar una Sesión de Aprendizaje oficial de altísima calidad pedagógica, completa, rigurosa y directamente aplicable en el aula.
Debes estructurar la sesión siguiendo estrictamente el estándar oficial del CNEB peruano con Áreas, Competencias, Capacidades, Desempeños precisados, Competencias Transversales, Capacidades Transversales, Enfoques Transversales, Secuencia Didáctica (Inicio: motivación, saberes previos, conflicto cognitivo, propósito; Desarrollo: gestión y acompañamiento con actividades detalladas; Cierre: metacognición y evaluación), Rúbrica de evaluación analítica con niveles AD (Destacado), A (Logrado), B (En Proceso) y C (En Inicio), y una Evaluación interactiva con preguntas tipo opción múltiple, verdadero/falso o respuesta corta.
Devuelve EXCLUSIVAMENTE una estructura JSON válida que se ajuste con exactitud al esquema solicitado.`;

    const prompt = `Por favor genera la Sesión de Aprendizaje completa bajo el CNEB con los siguientes datos:
Área Curricular: ${area || 'Desarrollo Personal, Ciudadanía y Cívica / Comunicación / Matemática / Ciencia y Tecnología'}
Grado: ${grade || 'Secundaria / Primaria'}
Sección: ${section || 'A'}
Docente: ${teacherName || 'Docente'}
Duración: ${duration || '90 minutos'}
Tema propuesto: ${theme || 'Basado en el contenido'}
${sourceContent ? `Contenido o material de referencia proporcionado:\n"""\n${sourceContent}\n"""` : ''}

El formato de respuesta JSON DEBE tener esta estructura exacta:
{
  "title": "Título significativo, motivador y pedagógico de la sesión",
  "area": "Nombre del Área curricular oficial",
  "specialty": "Especialidad o sub-disciplina (opcional)",
  "grade": "Grado y Nivel",
  "section": "Sección",
  "teacherName": "Nombre del Docente",
  "duration": "90 minutos",
  "theme": "${theme || ''}",
  "competencies": ["Competencia 1 oficial del CNEB", "Competencia 2 (si aplica)"],
  "capacities": ["Capacidad 1 asociada", "Capacidad 2 asociada"],
  "performances": ["Desempeño precisado y contextualizado para el grado con verbo de acción y condición"],
  "evidence": "Evidencia tangible producida por los estudiantes (ej: organizador visual, ensayo argumentativo, prototipo)",
  "instrument": "Rúbrica de evaluación / Lista de cotejo",
  "transversalCompetencies": [
    "Se desenvuelve en los entornos virtuales generados por las TIC",
    "Gestiona su aprendizaje de manera autónoma"
  ],
  "transversalCapacities": [
    "Personaliza entornos virtuales / Interactúa en entornos virtuales",
    "Define metas de aprendizaje / Monitorea y ajusta su desempeño"
  ],
  "transversalApproaches": [
    "Enfoque de Derechos: Disposición a conversar con otras personas intercambiando ideas...",
    "Enfoque Búsqueda de la Excelencia: Disposición para adaptarse a los cambios..."
  ],
  "sequence": {
    "inicio": {
      "motivation": "Estrategia concreta y dinámica para captar el interés de los estudiantes",
      "priorKnowledge": "Preguntas clave para rescatar saberes previos",
      "cognitiveConflict": "Pregunta problematizadora o situación retadora que genera el conflicto cognitivo",
      "purpose": "Propósito de aprendizaje comunicado con claridad a los alumnos",
      "timeMinutes": 15
    },
    "desarrollo": {
      "methodology": "Enfoque pedagógico activo (constructivista, ABP, indagación o resolución de problemas)",
      "activities": [
        "Paso 1: Planteamiento de la situación o análisis de información",
        "Paso 2: Trabajo colaborativo en equipos / experimentación",
        "Paso 3: Construcción guiada del conocimiento y acompañamiento docente",
        "Paso 4: Presentación o socialización de los hallazgos y contraste"
      ],
      "timeMinutes": 60
    },
    "cierre": {
      "metacognition": "Preguntas de reflexión metacognitiva (¿Qué aprendimos hoy? ¿Cómo lo aprendimos? ¿Qué dificultades tuvimos y cómo las superamos?)",
      "evaluationSummary": "Síntesis del docente y retroalimentación formativa",
      "timeMinutes": 15
    }
  },
  "rubric": [
    {
      "criteria": "Criterio 1 evaluado respecto a la competencia",
      "levels": {
        "destacado": "Nivel AD (Destacado): Supera las expectativas...",
        "logrado": "Nivel A (Logrado): Cumple satisfactoriamente...",
        "enProceso": "Nivel B (En Proceso): Presenta avances con algunas dificultades...",
        "enInicio": "Nivel C (En Inicio): Requiere acompañamiento constante..."
      }
    },
    {
      "criteria": "Criterio 2 evaluado respecto a la competencia",
      "levels": {
        "destacado": "Nivel AD...",
        "logrado": "Nivel A...",
        "enProceso": "Nivel B...",
        "enInicio": "Nivel C..."
      }
    }
  ],
  "assessment": {
    "instructions": "Lee atentamente cada una de las siguientes preguntas y responde según lo trabajado en clase.",
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "¿Pregunta conceptual o de aplicación 1?",
        "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"],
        "correctAnswer": "A) Opción 1",
        "explanation": "Justificación pedagógica de la respuesta correcta",
        "points": 5
      },
      {
        "id": "q2",
        "type": "multiple_choice",
        "question": "¿Pregunta de análisis o caso práctico 2?",
        "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"],
        "correctAnswer": "B) Opción 2",
        "explanation": "Justificación pedagógica de la respuesta correcta",
        "points": 5
      },
      {
        "id": "q3",
        "type": "true_false",
        "question": "¿Enunciado verdadero o falso relacionado con el tema?",
        "options": ["Verdadero", "Falso"],
        "correctAnswer": "Verdadero",
        "explanation": "Por qué es verdadero",
        "points": 5
      },
      {
        "id": "q4",
        "type": "short_answer",
        "question": "¿Pregunta abierta de argumentación o propuesta de solución?",
        "correctAnswer": "Criterio o palabras clave esperadas en la respuesta",
        "explanation": "Pautas de calificación para el docente",
        "points": 5
      }
    ]
  }
}`;

    const { text, modelUsed } = await callGeminiWithFailover(prompt, systemInstruction, true);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Clean up markdown block if present
      const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      modelUsed,
      sessionData: parsed
    });

  } catch (error: any) {
    console.error('Error in generate-session:', error);
    return NextResponse.json({ error: error.message || 'Error al generar la sesión con IA' }, { status: 500 });
  }
}

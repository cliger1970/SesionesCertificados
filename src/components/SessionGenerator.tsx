'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Download, FileText, Trash2, Edit3, Save, 
  HelpCircle, CheckCircle, Award, ListChecks, ChevronRight, Layers, Eye
} from 'lucide-react';
import { SessionPlan } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, 
  WidthType, BorderStyle, ShadingType, AlignmentType 
} from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function SessionGenerator() {
  const { success, error, info } = useToast();

  // State
  const [theme, setTheme] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [area, setArea] = useState('Desarrollo Personal, Ciudadanía y Cívica');
  const [grade, setGrade] = useState('3ro de Secundaria');
  const [section, setSection] = useState('A');
  const [teacherName, setTeacherName] = useState('Prof. David Mendoza');
  const [duration, setDuration] = useState('90 minutos');

  const [generating, setGenerating] = useState(false);
  const [sessions, setSessions] = useState<SessionPlan[]>([]);
  const [activeSession, setActiveSession] = useState<SessionPlan | null>(null);

  // Student test view modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [testScore, setTestScore] = useState<{ total: number; max: number } | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !activeSession) {
          setActiveSession(data.sessions[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!theme && !sourceContent) {
      error('Por favor ingresa un tema o pega el contenido base de la sesión.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          sourceContent,
          area,
          grade,
          section,
          teacherName,
          duration
        })
      });

      const data = await res.json();
      if (data.success && data.sessionData) {
        const generated: SessionPlan = {
          ...data.sessionData,
          id: `ses-${Date.now()}`,
          teacherName,
          grade,
          section,
          area,
          duration,
          theme: theme || 'Sesión Curricular',
          sourceContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save to DB
        const saveRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generated)
        });
        const saveData = await saveRes.json();

        setActiveSession(saveData.session || generated);
        await loadSessions();
        success(`¡Sesión oficial CNEB generada con éxito con ${data.modelUsed}!`);
      } else {
        error(data.error || 'Error al generar la sesión pedagógica.');
      }
    } catch (err: any) {
      error(err.message || 'Error en la llamada de IA.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        success('Sesión eliminada');
        if (activeSession?.id === id) {
          setActiveSession(null);
        }
        loadSessions();
      }
    } catch (e) {
      error('Error al eliminar');
    }
  };

  // Helper to create bordered table cells for Word
  const createCell = (text: string, isHeader: boolean = false, bgColor?: string, colSpan: number = 1, bold: boolean = false) => {
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: isHeader || bold,
              size: isHeader ? 20 : 18,
              color: isHeader ? "0F172A" : "334155"
            })
          ],
          spacing: { before: 80, after: 80 }
        })
      ],
      columnSpan: colSpan,
      shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 120, bottom: 120, left: 160, right: 160 }
    });
  };

  // Export to Word (.docx)
  const exportToWord = async () => {
    if (!activeSession) return;

    try {
      const tableBorderDef = {
        top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      };

      // Table 1: Datos Informativos
      const infoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDef,
        rows: [
          new TableRow({
            children: [createCell("DATOS INFORMATIVOS", true, "F1F5F9", 2)]
          }),
          new TableRow({
            children: [
              createCell("Título de la Sesión", true, undefined, 1),
              createCell(activeSession.title || "—", false, undefined, 1, true)
            ]
          }),
          new TableRow({
            children: [
              createCell("Área Curricular", true),
              createCell(activeSession.area || "—")
            ]
          }),
          new TableRow({
            children: [
              createCell("Grado y Sección", true),
              createCell(`${activeSession.grade} "${activeSession.section}"`)
            ]
          }),
          new TableRow({
            children: [
              createCell("Docente Responsable", true),
              createCell(activeSession.teacherName || "—")
            ]
          }),
          new TableRow({
            children: [
              createCell("Duración estimada", true),
              createCell(activeSession.duration || "90 minutos")
            ]
          }),
          new TableRow({
            children: [
              createCell("Propósito / Tema", true),
              createCell(activeSession.theme || "—")
            ]
          })
        ]
      });

      // Table 2: Propósitos y Evidencias
      const compText = (activeSession.competencies || []).map(c => `• ${c}`).join("\n") || "—";
      const capText = (activeSession.capacities || []).map(c => `• ${c}`).join("\n") || "—";
      const perfText = (activeSession.performances || []).map(p => `• ${p}`).join("\n") || "—";

      const propTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDef,
        rows: [
          new TableRow({
            children: [createCell("I. PROPÓSITOS Y EVIDENCIAS DE APRENDIZAJE", true, "F1F5F9", 2)]
          }),
          new TableRow({
            children: [
              createCell("Competencias", true, "F8FAFC"),
              createCell(compText)
            ]
          }),
          new TableRow({
            children: [
              createCell("Capacidades", true, "F8FAFC"),
              createCell(capText)
            ]
          }),
          new TableRow({
            children: [
              createCell("Desempeños Precisados (Criterios)", true, "F8FAFC"),
              createCell(perfText)
            ]
          }),
          new TableRow({
            children: [
              createCell("Evidencia de Aprendizaje", true, "ECFDF5"),
              createCell(activeSession.evidence || "—")
            ]
          }),
          new TableRow({
            children: [
              createCell("Instrumento de Evaluación", true, "EEF2FF"),
              createCell(activeSession.instrument || "Rúbrica")
            ]
          })
        ]
      });

      // Table 3: Transversales
      const tcText = (activeSession.transversalCompetencies || []).map(t => `• ${t}`).join("\n") || "—";
      const taText = (activeSession.transversalApproaches || []).map(t => `• ${t}`).join("\n") || "—";

      const transTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDef,
        rows: [
          new TableRow({
            children: [createCell("II. COMPETENCIAS Y ENFOQUES TRANSVERSALES", true, "F1F5F9", 2)]
          }),
          new TableRow({
            children: [
              createCell("Competencias Transversales", true, "F8FAFC"),
              createCell(tcText)
            ]
          }),
          new TableRow({
            children: [
              createCell("Enfoques Transversales y Valores", true, "F8FAFC"),
              createCell(taText)
            ]
          })
        ]
      });

      // Table 4: Secuencia Didáctica
      const seqInicio = `• Motivación: ${activeSession.sequence?.inicio?.motivation || "—"}\n• Saberes Previos: ${activeSession.sequence?.inicio?.priorKnowledge || "—"}\n• Conflicto Cognitivo: ${activeSession.sequence?.inicio?.cognitiveConflict || "—"}\n• Propósito: ${activeSession.sequence?.inicio?.purpose || "—"}`;
      const seqDesarrollo = `• Metodología: ${activeSession.sequence?.desarrollo?.methodology || "—"}\nActividades:\n${(activeSession.sequence?.desarrollo?.activities || []).map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
      const seqCierre = `• Metacognición: ${activeSession.sequence?.cierre?.metacognition || "—"}\n• Síntesis y Evaluación: ${activeSession.sequence?.cierre?.evaluationSummary || "—"}`;

      const seqTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDef,
        rows: [
          new TableRow({
            children: [createCell("III. SECUENCIA DIDÁCTICA (MOMENTOS PEDAGÓGICOS)", true, "F1F5F9", 3)]
          }),
          new TableRow({
            children: [
              createCell("Momento", true, "F8FAFC"),
              createCell("Estrategias y Actividades Pedagógicas", true, "F8FAFC"),
              createCell("Tiempo", true, "F8FAFC")
            ]
          }),
          new TableRow({
            children: [
              createCell("INICIO", true, "FEF3C7"),
              createCell(seqInicio),
              createCell(`${activeSession.sequence?.inicio?.timeMinutes || 15} min`, true)
            ]
          }),
          new TableRow({
            children: [
              createCell("DESARROLLO", true, "EFF6FF"),
              createCell(seqDesarrollo),
              createCell(`${activeSession.sequence?.desarrollo?.timeMinutes || 60} min`, true)
            ]
          }),
          new TableRow({
            children: [
              createCell("CIERRE", true, "ECFDF5"),
              createCell(seqCierre),
              createCell(`${activeSession.sequence?.cierre?.timeMinutes || 15} min`, true)
            ]
          })
        ]
      });

      // Table 5: Rúbrica de Evaluación
      const rubricRows = [
        new TableRow({
          children: [createCell("IV. RÚBRICA DE EVALUACIÓN ANALÍTICA", true, "F1F5F9", 5)]
        }),
        new TableRow({
          children: [
            createCell("Criterio", true, "F8FAFC"),
            createCell("Destacado (AD)", true, "ECFDF5"),
            createCell("Logrado (A)", true, "EFF6FF"),
            createCell("En Proceso (B)", true, "FEF3C7"),
            createCell("En Inicio (C)", true, "FFF1F2")
          ]
        }),
        ...(activeSession.rubric || []).map(r => 
          new TableRow({
            children: [
              createCell(r.criteria || "—", true),
              createCell(r.levels?.destacado || "—"),
              createCell(r.levels?.logrado || "—"),
              createCell(r.levels?.enProceso || "—"),
              createCell(r.levels?.enInicio || "—")
            ]
          })
        )
      ];

      const rubricTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDef,
        rows: rubricRows
      });

      // Table 6: Evaluación Interactiva
      const testRows = [
        new TableRow({
          children: [createCell("V. EVALUACIÓN Y PRUEBA OBJETIVA", true, "F1F5F9", 3)]
        }),
        new TableRow({
          children: [
            createCell(`Instrucciones: ${activeSession.assessment?.instructions || "Responde las siguientes preguntas."}`, false, "F8FAFC", 3)
          ]
        }),
        ...(activeSession.assessment?.questions || []).map((q, idx) => 
          new TableRow({
            children: [
              createCell(`N° ${idx + 1}`, true, "F8FAFC"),
              createCell(`${q.question}\n${q.options && q.options.length ? q.options.join("\n") : ""}\n\nRespuesta Clave: ${q.correctAnswer}\nJustificación: ${q.explanation}`),
              createCell(`${q.points || 5} pts`, true)
            ]
          })
        )
      ];

      const testTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorderDef,
        rows: testRows
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 }
              }
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "PLAN DE SESIÓN DE APRENDIZAJE - CNEB",
                    bold: true,
                    size: 30,
                    color: "1E293B"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              }),
              infoTable,
              new Paragraph({ text: "", spacing: { after: 200 } }),
              propTable,
              new Paragraph({ text: "", spacing: { after: 200 } }),
              transTable,
              new Paragraph({ text: "", spacing: { after: 200 } }),
              seqTable,
              new Paragraph({ text: "", spacing: { after: 200 } }),
              rubricTable,
              new Paragraph({ text: "", spacing: { after: 200 } }),
              testTable
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sesion_CNEB_${activeSession.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      success('Sesión descargada en formato Word (.docx)');
    } catch (err: any) {
      error('Error al generar Word: ' + err.message);
    }
  };

  // Export to PDF with structured tables matching the application UI
  const exportToPdf = () => {
    if (!activeSession) return;
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 14;

      // Header Banner
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, 10, 182, 18, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(margin, 10, 182, 18, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text('PLAN DE SESIÓN DE APRENDIZAJE - CNEB (MINEDU)', 105, 18, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Estructura Curricular y Pedagógica Oficial', 105, 24, { align: 'center' });

      let currentY = 32;

      // Table 1: Datos Informativos
      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [[{ content: 'DATOS INFORMATIVOS', colSpan: 2, styles: { halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]],
        body: [
          [{ content: 'Título de la Sesión', styles: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] } }, activeSession.title || '—'],
          [{ content: 'Área Curricular', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, activeSession.area || '—'],
          [{ content: 'Grado y Sección', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, `${activeSession.grade} "${activeSession.section}"`],
          [{ content: 'Docente Responsable', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, activeSession.teacherName || '—'],
          [{ content: 'Duración Estimada', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, activeSession.duration || '90 minutos'],
          [{ content: 'Tema / Propósito', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, activeSession.theme || '—']
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fontSize: 8.5, fontStyle: 'bold' }
      });
      currentY = (pdf as any).lastAutoTable.finalY + 5;

      // Table 2: Propósitos y Evidencias
      const compText = (activeSession.competencies || []).map(c => `• ${c}`).join('\n') || '—';
      const capText = (activeSession.capacities || []).map(c => `• ${c}`).join('\n') || '—';
      const perfText = (activeSession.performances || []).map(p => `• ${p}`).join('\n') || '—';

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [[{ content: 'I. PROPÓSITOS Y EVIDENCIAS DE APRENDIZAJE', colSpan: 2, styles: { halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]],
        body: [
          [{ content: 'Competencias', styles: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] } }, compText],
          [{ content: 'Capacidades', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, capText],
          [{ content: 'Desempeños Precisados\n(Criterios de Evaluación)', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, perfText],
          [{ content: 'Evidencia de Aprendizaje', styles: { fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [6, 95, 70] } }, { content: activeSession.evidence || '—', styles: { textColor: [6, 95, 70] } }],
          [{ content: 'Instrumento de Evaluación', styles: { fontStyle: 'bold', fillColor: [238, 242, 255], textColor: [55, 48, 163] } }, { content: activeSession.instrument || 'Rúbrica', styles: { textColor: [55, 48, 163] } }]
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fontSize: 8.5, fontStyle: 'bold' }
      });
      currentY = (pdf as any).lastAutoTable.finalY + 5;

      // Table 3: Transversales
      const tcText = (activeSession.transversalCompetencies || []).map(t => `• ${t}`).join('\n') || '—';
      const taText = (activeSession.transversalApproaches || []).map(t => `• ${t}`).join('\n') || '—';

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [[{ content: 'II. COMPETENCIAS Y ENFOQUES TRANSVERSALES', colSpan: 2, styles: { halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]],
        body: [
          [{ content: 'Competencias Transversales', styles: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] } }, tcText],
          [{ content: 'Enfoques Transversales y Valores', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, taText]
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fontSize: 8.5, fontStyle: 'bold' }
      });
      currentY = (pdf as any).lastAutoTable.finalY + 5;

      // Table 4: Secuencia Didáctica
      const seqInicio = `• Motivación: ${activeSession.sequence?.inicio?.motivation || '—'}\n• Saberes Previos: ${activeSession.sequence?.inicio?.priorKnowledge || '—'}\n• Conflicto Cognitivo: ${activeSession.sequence?.inicio?.cognitiveConflict || '—'}\n• Propósito Comunicado: ${activeSession.sequence?.inicio?.purpose || '—'}`;
      const seqDesarrollo = `• Metodología Activa: ${activeSession.sequence?.desarrollo?.methodology || '—'}\nActividades de Aprendizaje:\n${(activeSession.sequence?.desarrollo?.activities || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
      const seqCierre = `• Metacognición: ${activeSession.sequence?.cierre?.metacognition || '—'}\n• Retroalimentación y Síntesis: ${activeSession.sequence?.cierre?.evaluationSummary || '—'}`;

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [{ content: 'III. SECUENCIA DIDÁCTICA (MOMENTOS PEDAGÓGICOS)', colSpan: 3, styles: { halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }],
          ['Momento', 'Estrategias y Actividades Pedagógicas', 'Tiempo']
        ],
        body: [
          [
            { content: 'INICIO', styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [120, 53, 15] } },
            seqInicio,
            { content: `${activeSession.sequence?.inicio?.timeMinutes || 15} min`, styles: { halign: 'center', fontStyle: 'bold' } }
          ],
          [
            { content: 'DESARROLLO', styles: { fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [30, 58, 138] } },
            seqDesarrollo,
            { content: `${activeSession.sequence?.desarrollo?.timeMinutes || 60} min`, styles: { halign: 'center', fontStyle: 'bold' } }
          ],
          [
            { content: 'CIERRE', styles: { fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [6, 78, 59] } },
            seqCierre,
            { content: `${activeSession.sequence?.cierre?.timeMinutes || 15} min`, styles: { halign: 'center', fontStyle: 'bold' } }
          ]
        ],
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 130 },
          2: { cellWidth: 24 }
        },
        styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fontSize: 8.5, fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [51, 65, 85] }
      });
      currentY = (pdf as any).lastAutoTable.finalY + 5;

      // Table 5: Rúbrica de Evaluación
      const rubricBody = (activeSession.rubric || []).map(r => [
        { content: r.criteria || '—', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number] } },
        r.levels?.destacado || '—',
        r.levels?.logrado || '—',
        r.levels?.enProceso || '—',
        r.levels?.enInicio || '—'
      ]);

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [{ content: 'IV. RÚBRICA DE EVALUACIÓN ANALÍTICA', colSpan: 5, styles: { halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }],
          [
            'Criterio',
            { content: 'Destacado (AD)', styles: { fillColor: [236, 253, 245], textColor: [6, 95, 70] } },
            { content: 'Logrado (A)', styles: { fillColor: [239, 246, 255], textColor: [30, 64, 175] } },
            { content: 'En Proceso (B)', styles: { fillColor: [254, 243, 199], textColor: [146, 64, 14] } },
            { content: 'En Inicio (C)', styles: { fillColor: [255, 241, 242], textColor: [159, 18, 57] } }
          ]
        ],
        body: rubricBody,
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 }
        },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fontSize: 8, fontStyle: 'bold' }
      });
      currentY = (pdf as any).lastAutoTable.finalY + 5;

      // Table 6: Evaluación Objetiva
      const testBody = (activeSession.assessment?.questions || []).map((q, idx) => [
        { content: `N° ${idx + 1}`, styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [248, 250, 252] as [number, number, number] } },
        `${q.question}\n${q.options && q.options.length ? q.options.join('\n') : ''}\n\nRespuesta Correcta: ${q.correctAnswer}\nJustificación: ${q.explanation}`,
        { content: `${q.points || 5} pts`, styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
      ]);

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [{ content: 'V. EVALUACIÓN Y PRUEBA OBJETIVA', colSpan: 3, styles: { halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }],
          [{ content: `Instrucciones: ${activeSession.assessment?.instructions || 'Responde las siguientes preguntas.'}`, colSpan: 3, styles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'italic' } }]
        ],
        body: testBody,
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 146 },
          2: { cellWidth: 20 }
        },
        styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fontSize: 8.5, fontStyle: 'bold' }
      });

      pdf.save(`Sesion_${activeSession.id}.pdf`);
      success('Sesión descargada en formato PDF');
    } catch (e: any) {
      error('Error al exportar PDF: ' + e.message);
    }
  };

  // Student test submission
  const handleAnswerChange = (qId: string, val: string) => {
    setStudentAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleEvaluateStudentTest = () => {
    if (!activeSession?.assessment?.questions) return;
    let score = 0;
    let max = 0;
    activeSession.assessment.questions.forEach(q => {
      max += q.points || 5;
      const userAns = (studentAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (userAns && (userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns))) {
        score += q.points || 5;
      }
    });
    setTestScore({ total: score, max });
    success(`Evaluación calificada: Obtuviste ${score} de ${max} puntos.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Generador CNEB con IA</h3>
              <p className="text-xs text-slate-500">Sesión oficial + Rúbrica + Examen interactivo</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Área Curricular Oficial</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Desarrollo Personal, Ciudadanía y Cívica">Desarrollo Personal, Ciudadanía y Cívica</option>
                <option value="Ciencias Sociales">Ciencias Sociales</option>
                <option value="Comunicación">Comunicación</option>
                <option value="Matemática">Matemática</option>
                <option value="Ciencia y Tecnología">Ciencia y Tecnología</option>
                <option value="Educación para el Trabajo">Educación para el Trabajo</option>
                <option value="Inglés como Lengua Extranjera">Inglés como Lengua Extranjera</option>
                <option value="Arte y Cultura">Arte y Cultura</option>
                <option value="Educación Física">Educación Física</option>
                <option value="Educación Religiosa">Educación Religiosa</option>
                <option value="Tutoría y Orientación Educativa">Tutoría y Orientación Educativa</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grado / Nivel</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sección</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre del Docente</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tema Propuesto</label>
              <input
                type="text"
                placeholder="Ej. La deliberación sobre asuntos públicos y los derechos ciudadanos"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">O Pegar Contenido / Texto de Apoyo</label>
              <textarea
                rows={4}
                placeholder="Pega aquí párrafos de lectura, artículos, fragmentos de libros o guías para elaborar la sesión a partir de este material..."
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generando Sesión Curricular con IA...' : 'Generar Sesión Oficial'}</span>
            </button>
          </div>
        </div>

        {/* Saved Sessions List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Sesiones Guardadas ({sessions.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hay sesiones creadas todavía.</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    activeSession?.id === s.id
                      ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-medium'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="truncate mr-2">
                    <p className="font-bold truncate">{s.title}</p>
                    <p className="text-[10px] text-slate-500">{s.area} • {s.grade}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(s.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Preview and Editor Area */}
      <div className="lg:col-span-8 space-y-6">
        {activeSession ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                  Formato Oficial CNEB
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{activeSession.title}</h2>
                <p className="text-xs text-slate-500">
                  {activeSession.area} • {activeSession.grade} &quot;{activeSession.section}&quot; • Docente: {activeSession.teacherName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStudentAnswers({});
                    setTestScore(null);
                    setIsTestModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ListChecks className="w-4 h-4 text-amber-600" />
                  <span>Resolver Evaluación</span>
                </button>

                <button
                  onClick={exportToWord}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Descargar Word</span>
                </button>

                <button
                  onClick={exportToPdf}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            {/* Official MINEDU/CNEB Structured Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                <span>I. PROPÓSITOS Y EVIDENCIAS DE APRENDIZAJE</span>
                <span className="text-[11px] font-normal text-slate-500">Duración: {activeSession.duration}</span>
              </div>
              <div className="p-4 space-y-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    <p className="font-bold text-slate-800 mb-1">Competencias</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {activeSession.competencies?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    <p className="font-bold text-slate-800 mb-1">Capacidades</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {activeSession.capacities?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                  <p className="font-bold text-slate-800 mb-1">Desempeños Precisados (Criterios de Evaluación)</p>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {activeSession.performances?.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-900 mb-1">Evidencia de Aprendizaje</p>
                    <p className="text-emerald-800">{activeSession.evidence}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 mb-1">Instrumento de Evaluación</p>
                    <p className="text-indigo-800">{activeSession.instrument}</p>
                  </div>
                </div>
              </div>

              {/* Transversal Competencies & Approaches */}
              <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-800 border-t border-b border-slate-200">
                II. COMPETENCIAS Y ENFOQUES TRANSVERSALES
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                <div>
                  <p className="font-bold text-slate-800 mb-1">Competencias y Capacidades Transversales</p>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {activeSession.transversalCompetencies?.map((tc, i) => <li key={i}>{tc}</li>)}
                    {activeSession.transversalCapacities?.map((tc, i) => <li key={`c-${i}`} className="italic">{tc}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1">Enfoques Transversales y Valores</p>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {activeSession.transversalApproaches?.map((ta, i) => <li key={i}>{ta}</li>)}
                  </ul>
                </div>
              </div>

              {/* Didactic Sequence */}
              <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-800 border-t border-b border-slate-200">
                III. SECUENCIA DIDÁCTICA (MOMENTOS PEDAGÓGICOS)
              </div>
              <div className="p-4 space-y-4 bg-white">
                {/* Inicio */}
                <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>1. MOMENTO DE INICIO</span>
                    <span className="text-[11px] bg-amber-100 px-2 py-0.5 rounded">{activeSession.sequence?.inicio?.timeMinutes || 15} minutos</span>
                  </div>
                  <p><span className="font-semibold text-slate-700">• Motivación:</span> {activeSession.sequence?.inicio?.motivation}</p>
                  <p><span className="font-semibold text-slate-700">• Saberes Previos:</span> {activeSession.sequence?.inicio?.priorKnowledge}</p>
                  <p><span className="font-semibold text-slate-700">• Conflicto Cognitivo:</span> {activeSession.sequence?.inicio?.cognitiveConflict}</p>
                  <p><span className="font-semibold text-slate-700">• Propósito Comunicado:</span> {activeSession.sequence?.inicio?.purpose}</p>
                </div>

                {/* Desarrollo */}
                <div className="p-3 bg-blue-50/40 border border-blue-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>2. MOMENTO DE DESARROLLO (Gestión y Acompañamiento)</span>
                    <span className="text-[11px] bg-blue-100 px-2 py-0.5 rounded">{activeSession.sequence?.desarrollo?.timeMinutes || 60} minutos</span>
                  </div>
                  <p><span className="font-semibold text-slate-700">• Metodología Activa:</span> {activeSession.sequence?.desarrollo?.methodology}</p>
                  <div className="space-y-1 pt-1">
                    <p className="font-semibold text-slate-700">Actividades de Aprendizaje:</p>
                    <ul className="list-decimal list-inside text-slate-600 space-y-1 pl-1">
                      {activeSession.sequence?.desarrollo?.activities?.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Cierre */}
                <div className="p-3 bg-emerald-50/40 border border-emerald-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>3. MOMENTO DE CIERRE</span>
                    <span className="text-[11px] bg-emerald-100 px-2 py-0.5 rounded">{activeSession.sequence?.cierre?.timeMinutes || 15} minutos</span>
                  </div>
                  <p><span className="font-semibold text-slate-700">• Metacognición:</span> {activeSession.sequence?.cierre?.metacognition}</p>
                  <p><span className="font-semibold text-slate-700">• Retroalimentación y Síntesis:</span> {activeSession.sequence?.cierre?.evaluationSummary}</p>
                </div>
              </div>

              {/* Rubric Matrix */}
              <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-800 border-t border-b border-slate-200">
                IV. RÚBRICA DE EVALUACIÓN ANALÍTICA
              </div>
              <div className="p-4 overflow-x-auto bg-white">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200 w-1/4">Criterio</th>
                      <th className="p-2 border-r border-slate-200 bg-emerald-50/40">Destacado (AD)</th>
                      <th className="p-2 border-r border-slate-200 bg-blue-50/40">Logrado (A)</th>
                      <th className="p-2 border-r border-slate-200 bg-amber-50/40">En Proceso (B)</th>
                      <th className="p-2 bg-rose-50/40">En Inicio (C)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    {activeSession.rubric?.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/30">{r.criteria}</td>
                        <td className="p-2 border-r border-slate-200">{r.levels?.destacado}</td>
                        <td className="p-2 border-r border-slate-200">{r.levels?.logrado}</td>
                        <td className="p-2 border-r border-slate-200">{r.levels?.enProceso}</td>
                        <td className="p-2">{r.levels?.enInicio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Ninguna sesión seleccionada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ingresa un tema o contenido en el panel izquierdo y haz clic en &quot;Generar Sesión Oficial&quot; para crear la planificación pedagógica con IA.
            </p>
          </div>
        )}
      </div>

      {/* Interactive Assessment Modal for Students */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Evaluación Interactiva de la Sesión"
        subtitle={activeSession ? `${activeSession.title} — Resuelve el examen en línea` : ''}
        maxWidth="max-w-3xl"
      >
        {activeSession?.assessment ? (
          <div className="space-y-6 text-xs text-slate-700">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-medium">
              {activeSession.assessment.instructions}
            </div>

            {testScore && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">¡Resultado de tu Evaluación!</h4>
                  <p className="text-emerald-700 text-xs">Puntaje obtenido: {testScore.total} de {testScore.max} puntos posibles.</p>
                </div>
                <Award className="w-8 h-8 text-emerald-600" />
              </div>
            )}

            <div className="space-y-4">
              {activeSession.assessment.questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 text-xs">
                      {idx + 1}. {q.question}
                    </p>
                    <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                      {q.points || 5} pts
                    </span>
                  </div>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-1.5 pl-2">
                      {q.options.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={studentAnswers[q.id] === opt}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex items-center gap-4 pl-2">
                      {['Verdadero', 'Falso'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={val}
                            checked={studentAnswers[q.id] === val}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{val}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <input
                      type="text"
                      placeholder="Escribe tu respuesta aquí..."
                      value={studentAnswers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  )}

                  {testScore && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      <p><span className="font-semibold text-emerald-700">Respuesta Correcta:</span> {q.correctAnswer}</p>
                      <p className="text-slate-500 mt-0.5"><span className="font-medium">Explicación:</span> {q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleEvaluateStudentTest}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors"
              >
                Calificar Respuestas
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No hay evaluación disponible para esta sesión.</p>
        )}
      </Modal>
    </div>
  );
}

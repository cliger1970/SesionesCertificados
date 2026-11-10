'use client';

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Upload, Plus, Trash2, Save, Download, 
  Layers, QrCode, Type, Move, ZoomIn, ZoomOut, CheckCircle2, Copy, ExternalLink, Users, FileDown
} from 'lucide-react';
import { CanvasElement, CertificateTemplate, IssuedCertificate } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { optimizeImageToWebP } from '@/lib/imageOptimizer';

export function CertificateStudio() {
  const { success, error, info } = useToast();
  
  // Template state
  const [template, setTemplate] = useState<CertificateTemplate>({
    id: 'default-template',
    name: 'Certificado de Reconocimiento y Logro',
    backgroundImageUrl: '',
    width: 1200,
    height: 850,
    elements: [
      {
        id: 'el-titulo',
        type: 'text',
        fieldKey: 'titulo',
        content: 'CERTIFICADO DE RECONOCIMIENTO',
        x: 100,
        y: 180,
        width: 1000,
        height: 60,
        fontFamily: 'sans-serif',
        fontSize: 34,
        color: '#0f172a',
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center'
      },
      {
        id: 'el-otorgado',
        type: 'text',
        fieldKey: 'otorgado',
        content: 'Otorgado solemnemente a:',
        x: 200,
        y: 280,
        width: 800,
        height: 40,
        fontFamily: 'serif',
        fontSize: 20,
        color: '#475569',
        bold: false,
        italic: true,
        underline: false,
        strikethrough: false,
        align: 'center'
      },
      {
        id: 'el-nombre',
        type: 'text',
        fieldKey: 'fullName',
        content: '{{NOMBRE_COMPLETO}}',
        x: 100,
        y: 340,
        width: 1000,
        height: 70,
        fontFamily: 'serif',
        fontSize: 42,
        color: '#1e3a8a',
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center'
      },
      {
        id: 'el-motivo',
        type: 'text',
        fieldKey: 'customFields.motivo',
        content: 'Por haber completado con distinción sobresaliente los módulos del programa pedagógico y curricular, demostrando excelencia académica y compromiso formativo.',
        x: 150,
        y: 450,
        width: 900,
        height: 90,
        fontFamily: 'sans-serif',
        fontSize: 18,
        color: '#334155',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center'
      },
      {
        id: 'el-fecha',
        type: 'text',
        fieldKey: 'fecha',
        content: 'Emitido el 06 de Noviembre de 2026',
        x: 150,
        y: 580,
        width: 900,
        height: 40,
        fontFamily: 'sans-serif',
        fontSize: 16,
        color: '#64748b',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center'
      },
      {
        id: 'el-qr',
        type: 'qr',
        fieldKey: 'id',
        content: '{{QR_CODE}}',
        x: 980,
        y: 650,
        width: 130,
        height: 130,
        fontSize: 12,
        color: '#000000',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center'
      },
      {
        id: 'el-id',
        type: 'text',
        fieldKey: 'id',
        content: 'Código: {{ID_CERTIFICADO}}',
        x: 930,
        y: 790,
        width: 230,
        height: 30,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#64748b',
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center'
      }
    ],
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z'
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(0.65);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [sampleQrDataUrl, setSampleQrDataUrl] = useState<string>('');
  const [templateList, setTemplateList] = useState<CertificateTemplate[]>([]);

  // Bulk Modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [issuedHistory, setIssuedHistory] = useState<IssuedCertificate[]>([]);

  // Dragging & Resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elX: number; elY: number; elW: number; elH: number }>({
    x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0
  });

  useEffect(() => {
    // Generate preview QR
    QRCode.toDataURL('https://certificados.local/verificar?id=DEMO-12345', {
      margin: 1,
      width: 250,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(setSampleQrDataUrl).catch(console.error);

    loadSavedTemplate();
    loadIssued();
  }, []);

  const loadSavedTemplate = async (selectTemplateId?: string) => {
    try {
      const res = await fetch('/api/certificates/templates');
      const data = await res.json();
      if (data.templates && data.templates.length > 0) {
        setTemplateList(data.templates);
        if (selectTemplateId) {
          const found = data.templates.find((t: any) => t.id === selectTemplateId);
          if (found) setTemplate(found);
        } else {
          setTemplate(data.templates[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNewTemplate = () => {
    const newId = `plantilla-${Date.now().toString(36)}`;
    const brandNew: CertificateTemplate = {
      id: newId,
      name: `Nueva Plantilla (${templateList.length + 1})`,
      backgroundImageUrl: '',
      width: 1200,
      height: 850,
      elements: [
        {
          id: 'el-titulo',
          type: 'text',
          fieldKey: 'titulo',
          content: 'CERTIFICADO DE RECONOCIMIENTO',
          x: 100,
          y: 180,
          width: 1000,
          height: 60,
          fontFamily: 'sans-serif',
          fontSize: 34,
          color: '#0f172a',
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
          align: 'center'
        },
        {
          id: 'el-nombre',
          type: 'text',
          fieldKey: 'fullName',
          content: '{{NOMBRE_COMPLETO}}',
          x: 100,
          y: 340,
          width: 1000,
          height: 70,
          fontFamily: 'serif',
          fontSize: 42,
          color: '#1e3a8a',
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
          align: 'center'
        },
        {
          id: 'el-motivo',
          type: 'text',
          fieldKey: 'customFields.motivo',
          content: 'Por haber completado satisfactoriamente las actividades requeridas del programa.',
          x: 150,
          y: 450,
          width: 900,
          height: 90,
          fontFamily: 'sans-serif',
          fontSize: 18,
          color: '#334155',
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          align: 'center'
        },
        {
          id: 'el-qr',
          type: 'qr',
          fieldKey: 'id',
          content: '{{QR_CODE}}',
          x: 980,
          y: 650,
          width: 130,
          height: 130,
          fontSize: 12,
          color: '#000000',
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          align: 'center'
        },
        {
          id: 'el-id',
          type: 'text',
          fieldKey: 'id',
          content: 'Código: {{ID_CERTIFICADO}}',
          x: 930,
          y: 790,
          width: 230,
          height: 30,
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#64748b',
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
          align: 'center'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTemplate(brandNew);
    setTemplateList(prev => [...prev, brandNew]);
    setSelectedId(null);
    success('¡Nueva plantilla creada! Personalízala y presiona "Guardar Plantilla".');
  };

  const handleDeleteTemplate = async (templateIdToDelete: string) => {
    if (templateList.length <= 1) {
      error('Debes mantener al menos una plantilla en el sistema.');
      return;
    }
    try {
      const res = await fetch(`/api/certificates/templates?id=${templateIdToDelete}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        success('Plantilla eliminada exitosamente.');
        const remaining = templateList.filter(t => t.id !== templateIdToDelete);
        setTemplateList(remaining);
        if (template.id === templateIdToDelete) {
          setTemplate(remaining[0]);
        }
      }
    } catch (e: any) {
      error('Error al eliminar plantilla: ' + e.message);
    }
  };

  const loadIssued = async () => {
    try {
      const res = await fetch('/api/certificates/issue');
      const data = await res.json();
      if (data.certificates) {
        setIssuedHistory(data.certificates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedElement = template.elements.find(e => e.id === selectedId) || null;

  const updateSelected = (updates: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === selectedId ? { ...el, ...updates } : el)
    }));
  };

  const addTextElement = () => {
    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type: 'text',
      content: 'Nuevo Texto Personalizado',
      x: 300,
      y: 300,
      width: 400,
      height: 50,
      fontFamily: 'sans-serif',
      fontSize: 22,
      color: '#1e293b',
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      align: 'center'
    };
    setTemplate(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedId(newEl.id);
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== selectedId)
    }));
    setSelectedId(null);
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      info('Optimizando imagen...');
      const result = await optimizeImageToWebP(file);
      
      setTemplate(prev => ({ 
        ...prev, 
        backgroundImageUrl: result.dataUrl,
        width: result.width || prev.width,
        height: result.height || prev.height
      }));

      const origKb = (result.originalSize / 1024).toFixed(1);
      const optKb = (result.optimizedSize / 1024).toFixed(1);

      if (result.formatUsed === 'webp') {
        const ahorro = (100 - (result.optimizedSize / result.originalSize) * 100).toFixed(0);
        success(`¡Fondo cargado y optimizado a WebP (95%)! Reducido de ${origKb} KB a ${optKb} KB (${ahorro}% ahorro).`);
      } else {
        success(`¡Fondo cargado con formato original (${origKb} KB) porque el WebP comprimido pesaba más!`);
      }
    } catch (err: any) {
      error('Error al procesar la imagen: ' + err.message);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const res = await fetch('/api/certificates/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      const data = await res.json();
      if (data.success) {
        success('Plantilla de certificado guardada exitosamente.');
        await loadSavedTemplate(template.id);
      }
    } catch (err: any) {
      error('Error al guardar la plantilla.');
    }
  };

  // Download preview PDF directly from studio
  const handleDownloadPreviewPdf = async () => {
    const certElement = canvasRef.current;
    if (!certElement) return;

    try {
      // Temporarily reset scale transform for crisp 1:1 capture
      const originalTransform = certElement.style.transform;
      certElement.style.transform = 'none';

      const dataUrl = await toPng(certElement, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true
      });

      certElement.style.transform = originalTransform;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [template.width, template.height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, template.width, template.height);
      pdf.save(`${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_muestra.pdf`);
      success('PDF de muestra descargado con alta fidelidad gráfica.');
    } catch (err: any) {
      error('Error al generar PDF: ' + err.message);
    }
  };

  // Drag element
  const handleMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width,
      elH: el.height
    });
  };

  // Resize element
  const handleResizeMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width,
      elH: el.height
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedId) return;
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      updateSelected({
        x: Math.round(Math.max(0, Math.min(template.width - dragStart.elW, dragStart.elX + dx))),
        y: Math.round(Math.max(0, Math.min(template.height - dragStart.elH, dragStart.elY + dy)))
      });
    } else if (isResizing) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      updateSelected({
        width: Math.max(60, Math.round(dragStart.elW + dx)),
        height: Math.max(25, Math.round(dragStart.elH + dy))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Bulk Excel import
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const records = XLSX.utils.sheet_to_json(ws);
        
        if (records.length === 0) {
          error('El archivo Excel no contiene filas válidas.');
          return;
        }

        const res = await fetch('/api/certificates/bulk-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: template.id,
            records
          })
        });

        const data = await res.json();
        if (data.success) {
          success(`¡Procesados ${data.totalProcessed} certificados! (${data.createdCount} nuevos, ${data.updatedCount} actualizados)`);
          setIsBulkOpen(false);
          loadIssued();
        } else {
          error(data.error || 'Error al procesar el Excel.');
        }
      } catch (err: any) {
        error('Error leyendo el archivo Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk text paste
  const handleProcessPastedData = async () => {
    if (!pasteData.trim()) {
      error('Por favor pega los datos en el recuadro.');
      return;
    }

    const lines = pasteData.trim().split('\n').filter(l => l.trim().length > 0);
    const records: any[] = [];

    // Check if line is tab separated (from Excel copy-paste)
    for (const line of lines) {
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length >= 1) {
        records.push({
          fullName: parts[0],
          email: parts[1] || '',
          whatsapp: parts[2] || '',
          motivo: parts[3] || ''
        });
      }
    }

    if (records.length === 0) {
      error('No se detectaron registros válidos.');
      return;
    }

    try {
      const res = await fetch('/api/certificates/bulk-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          records
        })
      });

      const data = await res.json();
      if (data.success) {
        success(`¡Procesados ${data.totalProcessed} certificados exitosamente!`);
        setPasteData('');
        setIsBulkOpen(false);
        loadIssued();
      } else {
        error(data.error || 'Error al procesar registros.');
      }
    } catch (err: any) {
      error('Error al emitir certificados.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Template Selector & Management Bar */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] whitespace-nowrap mr-1">
            Mis Plantillas:
          </span>
          {templateList.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setTemplate(t);
                setSelectedId(null);
              }}
              className={`px-3 py-1.5 rounded-xl border font-semibold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
                template.id === t.id
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs ring-1 ring-indigo-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <span>{t.name}</span>
              {templateList.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(t.id);
                  }}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded"
                  title="Eliminar plantilla"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleCreateNewTemplate}
            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-all shrink-0 text-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Otra Plantilla</span>
          </button>
        </div>

        {/* Unique Link for active template */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px]">
          <span className="text-slate-500 font-medium">Formulario específico:</span>
          <a
            href={`/formulario-emision?templateId=${template.id}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>/formulario-emision?templateId={template.id.substring(0, 14)}...</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <input 
              type="text" 
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="text-base font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-slate-500">Diseñador interactivo tipo Canva • Arrastra, redimensiona y formatea</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-slate-600 text-xs mr-2">
            <button 
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))} 
              className="p-1.5 hover:bg-white rounded-lg transition-colors"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-medium">{Math.round(scale * 100)}%</span>
            <button 
              onClick={() => setScale(s => Math.min(1.2, s + 0.1))} 
              className="p-1.5 hover:bg-white rounded-lg transition-colors"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="cursor-pointer px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Fondo del Certificado</span>
            <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
          </label>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Emisión Masiva (Excel)</span>
          </button>

          <button
            onClick={handleDownloadPreviewPdf}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Descargar PDF de muestra del diseño actual"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>Descargar Muestra PDF</span>
          </button>

          <button
            onClick={handleSaveTemplate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Plantilla</span>
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-slate-700 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addTextElement}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-indigo-600" />
            <span>Añadir Texto</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Style Controls (Active when text element selected) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ bold: !selectedElement?.bold })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.bold ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Negrita"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ italic: !selectedElement?.italic })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.italic ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Cursiva"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ underline: !selectedElement?.underline })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.underline ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Subrayado"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ strikethrough: !selectedElement?.strikethrough })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.strikethrough ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Tachado"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ align: 'left' })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.align === 'left' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Alinear a la izquierda"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ align: 'center' })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.align === 'center' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Centrar"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ align: 'right' })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.align === 'right' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Alinear a la derecha"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!selectedElement || selectedElement.type !== 'text'}
              onClick={() => updateSelected({ align: 'justify' })}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedElement?.align === 'justify' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
              title="Justificar"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Size & Color */}
          {selectedElement && selectedElement.type === 'text' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400">Tamaño:</span>
                <input
                  type="number"
                  value={selectedElement.fontSize}
                  onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                  className="w-12 bg-transparent text-center font-semibold text-slate-800 focus:outline-none"
                  min={8}
                  max={120}
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400">Color:</span>
                <input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => updateSelected({ color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>

              <select
                value={selectedElement.fontFamily || 'sans-serif'}
                onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none"
              >
                <option value="sans-serif">Sans-Serif (Moderno)</option>
                <option value="serif">Serif (Elegante / Clásico)</option>
                <option value="monospace">Monospace (Técnico)</option>
              </select>
            </div>
          )}
        </div>

        {selectedElement && (
          <button
            onClick={deleteSelectedElement}
            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar elemento</span>
          </button>
        )}
      </div>

      {/* Main Interactive Canvas Area */}
      <div 
        className="w-full overflow-auto bg-slate-100/80 rounded-2xl p-8 border border-slate-200/80 shadow-inner flex justify-center items-center min-h-[580px] select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          ref={canvasRef}
          onClick={(e) => {
            // Deselect only if clicking directly on the canvas background
            if (e.target === canvasRef.current) {
              setSelectedId(null);
            }
          }}
          className="relative bg-white shadow-2xl transition-transform origin-top rounded-lg border border-slate-200"
          style={{
            width: `${template.width}px`,
            height: `${template.height}px`,
            transform: `scale(${scale})`,
            backgroundImage: template.backgroundImageUrl ? `url(${template.backgroundImageUrl})` : undefined,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: template.backgroundImageUrl ? 'transparent' : '#fcfcfd'
          }}
        >
          {/* Default Decorative Borders if no custom background */}
          {!template.backgroundImageUrl && (
            <div className="absolute inset-4 border-4 border-double border-indigo-900/30 rounded pointer-events-none flex flex-col justify-between p-6">
              <div className="flex justify-between items-start opacity-20">
                <div className="w-16 h-16 border-t-4 border-l-4 border-indigo-900" />
                <div className="w-16 h-16 border-t-4 border-r-4 border-indigo-900" />
              </div>
              <div className="flex justify-between items-end opacity-20">
                <div className="w-16 h-16 border-b-4 border-l-4 border-indigo-900" />
                <div className="w-16 h-16 border-b-4 border-r-4 border-indigo-900" />
              </div>
            </div>
          )}

          {/* Canvas Elements */}
          {template.elements.map((el) => {
            const isSelected = el.id === selectedId;

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                className={`absolute cursor-move group transition-shadow ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 z-30 shadow-md' : 'hover:ring-1 hover:ring-indigo-300 z-10'
                }`}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
              >
                {/* Element Content */}
                {el.type === 'text' && (
                  <div
                    contentEditable={isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => updateSelected({ content: e.currentTarget.innerText })}
                    className="w-full h-full flex items-center overflow-hidden break-words px-2"
                    style={{
                      fontFamily: el.fontFamily,
                      fontSize: `${el.fontSize}px`,
                      color: el.color,
                      fontWeight: el.bold ? 'bold' : 'normal',
                      fontStyle: el.italic ? 'italic' : 'normal',
                      textDecoration: `${el.underline ? 'underline ' : ''}${el.strikethrough ? 'line-through' : ''}`.trim() || 'none',
                      textAlign: el.align,
                      justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {el.content}
                  </div>
                )}

                {el.type === 'qr' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-white/90 rounded border border-slate-300 shadow-xs">
                    {sampleQrDataUrl ? (
                      <img src={sampleQrDataUrl} alt="QR Preview" className="w-full h-full object-contain pointer-events-none" />
                    ) : (
                      <QrCode className="w-10 h-10 text-slate-700" />
                    )}
                  </div>
                )}

                {/* Resizing Handle */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(e, el)}
                    className="absolute -right-2 -bottom-2 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white cursor-se-resize shadow-md"
                    title="Arrastra para redimensionar"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Issued Certificates Table & Form Links */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Certificados Emitidos & Enlaces Públicos</h3>
            <p className="text-xs text-slate-500">
              Cada certificado cuenta con su ID y código QR único de validación anti-fraude
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/formulario-emision?templateId=${template.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Formulario de esta Plantilla</span>
            </a>
            <a
              href="/verificar"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Página de Verificación de QR</span>
            </a>
          </div>
        </div>

        {issuedHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No se han emitido certificados todavía. Puedes usar el botón de &quot;Emisión Masiva (Excel)&quot; o compartir el enlace público.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Código Único</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {issuedHistory.slice(0, 10).map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{cert.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{cert.fullName}</td>
                    <td className="py-3 px-4 text-slate-500">{cert.email}</td>
                    <td className="py-3 px-4 text-slate-500">{cert.whatsapp || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/verificar?id=${cert.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver / Descargar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Excel Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Emisión Masiva de Certificados"
        subtitle="Sube tu archivo de Excel o pega directamente las filas copiadas de una hoja de cálculo"
      >
        <div className="space-y-6 text-xs text-slate-700">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Opción 1: Subir archivo Excel (.xlsx, .csv)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileUpload}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="font-semibold text-slate-800">Haz clic aquí para seleccionar tu archivo Excel</span>
                <span className="text-[11px] text-slate-500 mt-1">Columnas recomendadas: Nombre, Correo, Telefono, Motivo</span>
              </label>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 font-medium">O TAMBIÉN</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Opción 2: Pegar directamente celdas de Excel
            </label>
            <textarea
              rows={5}
              placeholder={`Copia las celdas en Excel y pégalas aquí directamente:\nJuan Perez\tjuan@correo.com\t+51999888777\tAprobado con honores\nMaria Lopez\tmaria@correo.com\t+51988777666\tParticipación activa`}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              * Nota: Si un estudiante ya existe por su correo o WhatsApp, se actualizarán sus datos automáticamente sin crear duplicados.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsBulkOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcessPastedData}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors"
            >
              Procesar y Emitir Masivamente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

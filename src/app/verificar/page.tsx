'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Award, CheckCircle2, Download, AlertTriangle, ArrowRight, ShieldCheck, Mail, Phone, User, Edit3 } from 'lucide-react';
import { useToast, ToastProvider } from '@/components/Toast';
import { CertificateTemplate, IssuedCertificate } from '@/lib/types';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

function VerifyCertificateContent() {
  const { success, error, info } = useToast();
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [notFound, setNotFound] = useState(false);
  const [previewScale, setPreviewScale] = useState<number>(0.65);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');

  useEffect(() => {
    // Dynamically adjust scale to fit screen comfortably
    const handleResize = () => {
      const containerWidth = Math.min(window.innerWidth - 64, 850);
      const targetWidth = template?.width || 1200;
      setPreviewScale(Math.min(0.85, Math.max(0.25, containerWidth / targetWidth)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [template]);

  useEffect(() => {
    // Get query param 'id'
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setCertId(id);
      verifyId(id);
    }
  }, []);

  const verifyId = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/certificates/issue?id=${encodeURIComponent(idToVerify.trim())}`);
      const data = await res.json();

      if (data.certificate) {
        setCertificate(data.certificate);
        setEditName(data.certificate.fullName);
        setEditEmail(data.certificate.email);
        setEditWhatsapp(data.certificate.whatsapp || '');

        // Fetch template
        const tRes = await fetch('/api/certificates/templates');
        const tData = await tRes.json();
        if (tData.templates && tData.templates.length > 0) {
          const matched = tData.templates.find((t: any) => t.id === data.certificate.templateId) || tData.templates[0];
          setTemplate(matched);
        }

        // Generate QR Data URL
        const verifyUrl = `${window.location.origin}/verificar?id=${data.certificate.id}`;
        const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 250 });
        setQrDataUrl(qr);
        success('Certificado verificado y auténtico.');
      } else {
        setNotFound(true);
        setCertificate(null);
        error('Certificado no encontrado en el registro oficial.');
      }
    } catch (err: any) {
      error('Error al consultar el certificado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!certificate) return;
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: certificate.templateId,
          fullName: editName,
          email: editEmail,
          whatsapp: editWhatsapp,
          idToUpdate: certificate.id
        })
      });
      const data = await res.json();
      if (data.success && data.certificate) {
        setCertificate(data.certificate);
        setIsEditing(false);
        success('¡Información del certificado actualizada exitosamente!');
      } else {
        error(data.error || 'Error al actualizar.');
      }
    } catch (e: any) {
      error('Error de actualización.');
    }
  };

  const downloadCertificatePdf = async () => {
    const certElement = document.getElementById('rendered-certificate');
    if (!certElement) return;

    try {
      const dataUrl = await toPng(certElement, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true
      });

      const width = template?.width || 1200;
      const height = template?.height || 850;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`Certificado_${certificate?.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${certificate?.id}.pdf`);
      success('Certificado descargado con éxito en alta resolución.');
    } catch (err: any) {
      error('Error al generar PDF: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Portal Oficial de Verificación y Validación de Certificados
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Validador de Autenticidad QR
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto">
            Ingresa el código alfanumérico único del certificado o escanea su código QR para certificar su legitimidad en el registro.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex gap-2 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Ej. CERT-4F9A-L4K9M0..."
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verifyId(certId)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => verifyId(certId)}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Verificar'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {notFound && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Certificado No Encontrado</h3>
            <p className="text-xs text-rose-700">
              El código proporcionado no coincide con ningún certificado emitido en la base de datos oficial.
            </p>
          </div>
        )}

        {certificate && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Documento Válido & Auténtico
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">ID: {certificate.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">{certificate.fullName}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancelar Edición' : 'Editar Información'}</span>
                </button>
                <button
                  onClick={downloadCertificatePdf}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Certificado PDF</span>
                </button>
              </div>
            </div>

            {/* In-place Editing Form if user clicks edit */}
            {isEditing && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Actualizar Datos Registrados</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Guardar y Regenerar Certificado
                  </button>
                </div>
              </div>
            )}

            {/* Certificate Visual Render Box */}
            <div 
              className="w-full overflow-hidden flex justify-center items-center py-6 bg-slate-100 rounded-2xl border border-slate-200"
              style={{
                minHeight: `${Math.round((template?.height || 850) * previewScale + 48)}px`
              }}
            >
              <div
                style={{
                  width: `${template?.width || 1200}px`,
                  height: `${template?.height || 850}px`,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center'
                }}
              >
                <div
                  id="rendered-certificate"
                  className="relative bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200"
                  style={{
                    width: `${template?.width || 1200}px`,
                    height: `${template?.height || 850}px`,
                    backgroundImage: template?.backgroundImageUrl ? `url(${template.backgroundImageUrl})` : undefined,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: template?.backgroundImageUrl ? 'transparent' : '#ffffff'
                  }}
                >
                  {!template?.backgroundImageUrl && (
                    <div className="absolute inset-4 border-4 border-double border-indigo-900/30 rounded pointer-events-none" />
                  )}

                  {/* Render elements replacing tokens */}
                  {template?.elements.map((el) => {
                    let text = el.content;
                    if (el.type === 'text') {
                      text = text
                        .replace('{{NOMBRE_COMPLETO}}', certificate.fullName)
                        .replace('{{ID_CERTIFICADO}}', certificate.id)
                        .replace('{{CORREO}}', certificate.email)
                        .replace('{{TELEFONO}}', certificate.whatsapp || '');

                      return (
                        <div
                          key={el.id}
                          className="absolute flex items-center overflow-hidden break-words px-2"
                          style={{
                            left: `${el.x}px`,
                            top: `${el.y}px`,
                            width: `${el.width}px`,
                            height: `${el.height}px`,
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
                          {text}
                        </div>
                      );
                    }

                    if (el.type === 'qr') {
                      return (
                        <div
                          key={el.id}
                          className="absolute bg-white/95 p-1.5 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center"
                          style={{
                            left: `${el.x}px`,
                            top: `${el.y}px`,
                            width: `${el.width}px`,
                            height: `${el.height}px`,
                          }}
                        >
                          {qrDataUrl && (
                            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <ToastProvider>
      <VerifyCertificateContent />
    </ToastProvider>
  );
}

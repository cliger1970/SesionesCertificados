'use client';

import React, { useState } from 'react';
import { Award, User, Mail, Phone, Send, CheckCircle2, ArrowRight, ShieldCheck, Edit3 } from 'lucide-react';
import { useToast, ToastProvider } from '@/components/Toast';

function EmissionFormContent() {
  const { success, error, info } = useToast();
  const [templateId, setTemplateId] = useState('default-template');
  const [templateName, setTemplateName] = useState('Certificado Oficial');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedResult, setIssuedResult] = useState<any>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('templateId') || params.get('id');
    if (tid) {
      setTemplateId(tid);
      fetch(`/api/certificates/templates?id=${encodeURIComponent(tid)}`)
        .then(res => res.json())
        .then(data => {
          if (data.template) {
            setTemplateName(data.template.name);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      error('Por favor completa tu nombre completo y correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: templateId || 'default-template',
          fullName: fullName.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          customFields: { motivo: motivo.trim() }
        })
      });

      const data = await res.json();
      if (data.success && data.certificate) {
        setIssuedResult(data);
        if (data.updated) {
          info('Detectamos tu registro previo: ¡Certificado actualizado con tus nuevos datos!');
        } else {
          success('¡Tu certificado ha sido emitido con éxito!');
        }
      } else {
        error(data.error || 'No se pudo emitir el certificado.');
      }
    } catch (err: any) {
      error('Error al enviar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" /> Emisión Oficial de Certificados
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {templateName}
          </h1>
          <p className="text-xs text-slate-500">
            Ingresa tus datos verídicos para generar tu certificado con validación QR única.
          </p>
        </div>

        {issuedResult ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {issuedResult.updated ? '¡Certificado Actualizado!' : '¡Certificado Emitido!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Registrado a nombre de <span className="font-semibold text-slate-700">{issuedResult.certificate.fullName}</span>
              </p>
              <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-600">
                Código: {issuedResult.certificate.id}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`/verificar?id=${issuedResult.certificate.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Ver y Descargar mi Certificado PDF</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIssuedResult(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Modificar datos
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4">
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-[11px] text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Validación Anti-duplicidad:</span> Si ya registraste tus datos previamente con este correo o WhatsApp, podrás editar la información y se emitirá tu certificado actualizado.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ej. David Mendoza Quispe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Número de WhatsApp (Opcional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="+51 987 654 321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Validando y Generando...' : 'Enviar y Emitir Certificado'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function FormularioEmisionPage() {
  return (
    <ToastProvider>
      <EmissionFormContent />
    </ToastProvider>
  );
}

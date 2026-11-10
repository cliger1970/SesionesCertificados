'use client';

import React, { useState } from 'react';
import { Award, BookOpen, Settings, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ToastProvider } from '@/components/Toast';
import { SettingsModal } from '@/components/SettingsModal';
import { CertificateStudio } from '@/components/CertificateStudio';
import { SessionGenerator } from '@/components/SessionGenerator';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'sessions'>('certificates');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* SaaS Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              EduSuite Pro
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                SaaS v3.8
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Certificados Inteligentes & Planificación Curricular CNEB con Gemini AI
            </p>
          </div>
        </div>

        {/* Tab Navigation & Settings */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'certificates'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Generador de Certificados</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'sessions'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sesiones & Evaluaciones CNEB</span>
            </button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/70"
            title="Configuración de Gemini AI & Multi-Key Failover"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'certificates' ? <CertificateStudio /> : <SessionGenerator />}
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}

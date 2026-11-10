'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, RefreshCw, Check, Plus, Trash2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { success, error, info } = useToast();
  const [keys, setKeys] = useState<string[]>([]);
  const [preferredModel, setPreferredModel] = useState<string>('gemini-3.5-flash-lite');
  const [newKey, setNewKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [detectedModels, setDetectedModels] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/config');
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
      if (data.preferredModel) {
        setPreferredModel(data.preferredModel);
      }
    } catch (err: any) {
      error('No se pudo cargar la configuración de Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    if (keys.includes(newKey.trim())) {
      info('Esa clave API ya está en la lista.');
      return;
    }
    setKeys([...keys, newKey.trim()]);
    setNewKey('');
  };

  const handleRemoveKey = (idx: number) => {
    const updated = keys.filter((_, i) => i !== idx);
    setKeys(updated);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/gemini/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          keys,
          preferredModel
        })
      });
      const data = await res.json();
      if (data.success) {
        success('¡Configuración de API Keys guardada!');
        onClose();
      } else {
        error(data.error || 'Error al guardar.');
      }
    } catch (err: any) {
      error(err.message || 'Error de red.');
    }
  };

  const handleTestConnection = async () => {
    if (keys.length === 0) {
      error('Agrega al menos una API Key para probar la conexión.');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/gemini/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-models',
          testKey: keys[0]
        })
      });
      const data = await res.json();
      if (data.success && data.models) {
        setDetectedModels(data.models);
        success(`Conexión exitosa. Se detectaron ${data.models.length} modelos dinámicos en tu cuenta de Google AI Studio.`);
      } else {
        error(data.error || 'Error en la verificación de la API Key.');
      }
    } catch (err: any) {
      error(err.message || 'Error de conexión.');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Configuración de Gemini AI</h3>
              <p className="text-xs text-slate-500">Multi-Key con Failover automático y modelos dinámicos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Failover Explanation */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100/80 rounded-xl flex items-start gap-3 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Mecanismo de Resiliencia:</span> Si una clave alcanza su límite de cuota (Rate Limit 429) o expira, el sistema conmuta automáticamente a la siguiente clave disponible sin interrumpir la generación.
            </div>
          </div>

          {/* Key list */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Claves de API de Gemini ({keys.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {keys.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No hay claves añadidas aún. Agrega una clave para habilitar la IA.
                </div>
              ) : (
                keys.map((k, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
                    <span className="truncate max-w-[280px] text-slate-700">
                      {k.length > 10 ? `${k.substring(0, 6)}...${k.substring(k.length - 4)}` : k}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-sans font-medium">
                        Prioridad #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveKey(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                        title="Eliminar clave"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input to add key */}
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                placeholder="Pega aquí tu Gemini API Key (AIzaSy...)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddKey}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Modelo Principal de Generación
              </label>
              <button
                onClick={handleTestConnection}
                disabled={testing || keys.length === 0}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Detectando en vivo...' : 'Detectar modelos de mi cuenta'}
              </button>
            </div>

            <select
              value={preferredModel}
              onChange={(e) => setPreferredModel(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Rápido, Gratuito, Más Reciente)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Máxima Inteligencia y Razonamiento)</option>
              <option value="gemini-3.6-flash">gemini-3.6-flash (Equilibrado para Agentes)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Estable)</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Ligero)</option>
              {detectedModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} {m.displayName ? `— (${m.displayName})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Si el modelo seleccionado no estuviera disponible temporalmente, el motor conmuta automáticamente a los modelos de respaldo.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

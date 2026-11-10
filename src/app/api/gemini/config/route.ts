import { NextRequest, NextResponse } from 'next/server';
import { getGeminiConfig, saveGeminiConfig, fetchAvailableGeminiModels } from '@/lib/gemini';

export async function GET() {
  try {
    const config = getGeminiConfig();
    // Return keys masked for security, plus raw count
    const maskedKeys = config.keys.map(k => {
      if (k.length <= 8) return '****';
      return `${k.substring(0, 4)}...${k.substring(k.length - 4)}`;
    });
    return NextResponse.json({
      keys: config.keys,
      maskedKeys,
      preferredModel: config.preferredModel || 'gemini-3.5-flash-lite'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, keys, preferredModel, testKey } = body;

    if (action === 'save') {
      const cleanKeys = Array.isArray(keys) ? keys.filter((k: string) => typeof k === 'string' && k.trim().length > 0) : [];
      saveGeminiConfig({
        keys: cleanKeys,
        preferredModel: preferredModel || 'gemini-3.5-flash-lite'
      });
      return NextResponse.json({ success: true, message: 'Configuración guardada exitosamente.' });
    }

    if (action === 'test-models') {
      const keyToTest = testKey || getGeminiConfig().keys[0];
      if (!keyToTest) {
        return NextResponse.json({ error: 'No hay ninguna clave API para probar.' }, { status: 400 });
      }
      const models = await fetchAvailableGeminiModels(keyToTest);
      return NextResponse.json({ success: true, models });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

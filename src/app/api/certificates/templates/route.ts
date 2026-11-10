import { NextRequest, NextResponse } from 'next/server';
import { readDbFile, writeDbFile } from '@/lib/db';
import { CertificateTemplate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATES_FILE = 'templates.json';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const templates = readDbFile<CertificateTemplate[]>(TEMPLATES_FILE, []);

    if (id) {
      const template = templates.find(t => t.id === id);
      if (!template) {
        return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    let templates = readDbFile<CertificateTemplate[]>(TEMPLATES_FILE, []);
    templates = templates.filter(t => t.id !== id);
    writeDbFile(TEMPLATES_FILE, templates);

    return NextResponse.json({ success: true, message: 'Plantilla eliminada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const templates = readDbFile<CertificateTemplate[]>(TEMPLATES_FILE, []);

    const newTemplate: CertificateTemplate = {
      id: body.id || uuidv4(),
      name: body.name || 'Certificado sin título',
      backgroundImageUrl: body.backgroundImageUrl || '',
      width: body.width || 1200,
      height: body.height || 850,
      elements: body.elements || [
        {
          id: 'el-nombre',
          type: 'text',
          fieldKey: 'fullName',
          content: '{{NOMBRE_COMPLETO}}',
          x: 200,
          y: 350,
          width: 800,
          height: 70,
          fontSize: 38,
          color: '#1e293b',
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
          content: 'Por haber completado satisfactoriamente el programa de capacitación pedagógica y curricular con éxito.',
          x: 250,
          y: 440,
          width: 700,
          height: 80,
          fontSize: 18,
          color: '#475569',
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
          x: 1000,
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
          content: 'ID: {{ID_CERTIFICADO}}',
          x: 950,
          y: 790,
          width: 220,
          height: 25,
          fontSize: 11,
          color: '#64748b',
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          align: 'center'
        }
      ],
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = templates.findIndex(t => t.id === newTemplate.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = newTemplate;
    } else {
      templates.push(newTemplate);
    }

    writeDbFile(TEMPLATES_FILE, templates);
    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

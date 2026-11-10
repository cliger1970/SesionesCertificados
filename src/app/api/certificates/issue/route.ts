import { NextRequest, NextResponse } from 'next/server';
import { readDbFile, writeDbFile } from '@/lib/db';
import { IssuedCertificate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const CERTIFICATES_FILE = 'issued_certificates.json';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const whatsapp = searchParams.get('whatsapp');
    const templateId = searchParams.get('templateId');

    const certificates = readDbFile<IssuedCertificate[]>(CERTIFICATES_FILE, []);

    if (id) {
      const cert = certificates.find(c => c.id.toLowerCase() === id.toLowerCase());
      if (!cert) {
        return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ certificate: cert });
    }

    let filtered = certificates;
    if (templateId) {
      filtered = filtered.filter(c => c.templateId === templateId);
    }
    if (email) {
      filtered = filtered.filter(c => c.email.toLowerCase() === email.toLowerCase());
    }
    if (whatsapp) {
      filtered = filtered.filter(c => c.whatsapp === whatsapp);
    }

    return NextResponse.json({ certificates: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, fullName, email, whatsapp, customFields, idToUpdate } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: 'El nombre completo y correo electrónico son obligatorios.' }, { status: 400 });
    }

    const certificates = readDbFile<IssuedCertificate[]>(CERTIFICATES_FILE, []);

    // Check anti-duplicity (by email or whatsapp for this template)
    const normalizedEmail = email.trim().toLowerCase();
    const cleanWhatsapp = whatsapp ? whatsapp.trim() : '';

    const existingCertIndex = certificates.findIndex(c => {
      if (idToUpdate && c.id === idToUpdate) return true;
      if (c.templateId !== templateId) return false;
      const matchEmail = c.email.toLowerCase() === normalizedEmail;
      const matchWhatsapp = cleanWhatsapp && c.whatsapp === cleanWhatsapp;
      return matchEmail || matchWhatsapp;
    });

    if (existingCertIndex >= 0) {
      // Allow editing/updating existing certificate!
      const existing = certificates[existingCertIndex];
      const updatedCert: IssuedCertificate = {
        ...existing,
        fullName: fullName.trim(),
        email: normalizedEmail,
        whatsapp: cleanWhatsapp,
        customFields: { ...existing.customFields, ...(customFields || {}) },
        updatedAt: new Date().toISOString()
      };
      certificates[existingCertIndex] = updatedCert;
      writeDbFile(CERTIFICATES_FILE, certificates);
      return NextResponse.json({
        success: true,
        updated: true,
        message: 'Certificado existente actualizado con éxito.',
        certificate: updatedCert
      });
    }

    // Generate new unique ID
    const newId = `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const newCertificate: IssuedCertificate = {
      id: newId,
      templateId: templateId || 'default',
      fullName: fullName.trim(),
      email: normalizedEmail,
      whatsapp: cleanWhatsapp,
      customFields: customFields || {},
      issuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    certificates.push(newCertificate);
    writeDbFile(CERTIFICATES_FILE, certificates);

    return NextResponse.json({
      success: true,
      updated: false,
      message: 'Certificado emitido exitosamente con código único.',
      certificate: newCertificate
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

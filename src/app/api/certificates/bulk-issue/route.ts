import { NextRequest, NextResponse } from 'next/server';
import { readDbFile, writeDbFile } from '@/lib/db';
import { IssuedCertificate } from '@/lib/types';

const CERTIFICATES_FILE = 'issued_certificates.json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, records } = body;

    if (!templateId || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Parámetros inválidos o lista vacía' }, { status: 400 });
    }

    const certificates = readDbFile<IssuedCertificate[]>(CERTIFICATES_FILE, []);
    const results: IssuedCertificate[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of records) {
      const fullName = (row.fullName || row.nombre || row.NOMBRES || row.Nombre || '').toString().trim();
      const email = (row.email || row.correo || row.EMAIL || row.Correo || '').toString().trim().toLowerCase();
      const whatsapp = (row.whatsapp || row.telefono || row.celular || row.TELEFONO || '').toString().trim();

      if (!fullName) continue;

      // Find if exists
      const existingIdx = certificates.findIndex(c => 
        c.templateId === templateId && (
          (email && c.email.toLowerCase() === email) ||
          (whatsapp && c.whatsapp === whatsapp) ||
          c.fullName.toLowerCase() === fullName.toLowerCase()
        )
      );

      const customFields: Record<string, string> = {};
      for (const key of Object.keys(row)) {
        if (!['fullName', 'nombre', 'NOMBRES', 'Nombre', 'email', 'correo', 'EMAIL', 'Correo', 'whatsapp', 'telefono', 'celular'].includes(key)) {
          customFields[key] = String(row[key]);
        }
      }

      if (existingIdx >= 0) {
        certificates[existingIdx].fullName = fullName;
        if (email) certificates[existingIdx].email = email;
        if (whatsapp) certificates[existingIdx].whatsapp = whatsapp;
        certificates[existingIdx].customFields = { ...certificates[existingIdx].customFields, ...customFields };
        certificates[existingIdx].updatedAt = new Date().toISOString();
        results.push(certificates[existingIdx]);
        updatedCount++;
      } else {
        const newId = `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        const newCert: IssuedCertificate = {
          id: newId,
          templateId,
          fullName,
          email: email || `user_${Math.random().toString(36).substring(4)}@correo.local`,
          whatsapp,
          customFields,
          issuedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        certificates.push(newCert);
        results.push(newCert);
        createdCount++;
      }
    }

    writeDbFile(CERTIFICATES_FILE, certificates);

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: results.length,
      certificates: results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

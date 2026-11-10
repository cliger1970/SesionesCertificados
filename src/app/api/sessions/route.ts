import { NextRequest, NextResponse } from 'next/server';
import { readDbFile, writeDbFile } from '@/lib/db';
import { SessionPlan } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const SESSIONS_FILE = 'learning_sessions.json';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sessions = readDbFile<SessionPlan[]>(SESSIONS_FILE, []);

    if (id) {
      const item = sessions.find(s => s.id === id);
      if (!item) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
      return NextResponse.json({ session: item });
    }

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessions = readDbFile<SessionPlan[]>(SESSIONS_FILE, []);

    const session: SessionPlan = {
      id: body.id || uuidv4(),
      title: body.title || 'Sesión de Aprendizaje',
      teacherName: body.teacherName || '',
      grade: body.grade || '',
      section: body.section || '',
      area: body.area || '',
      specialty: body.specialty || '',
      duration: body.duration || '90 minutos',
      date: body.date || new Date().toISOString().split('T')[0],
      theme: body.theme || '',
      sourceContent: body.sourceContent || '',
      competencies: body.competencies || [],
      capacities: body.capacities || [],
      performances: body.performances || [],
      evidence: body.evidence || '',
      instrument: body.instrument || 'Rúbrica de evaluación',
      transversalCompetencies: body.transversalCompetencies || [],
      transversalCapacities: body.transversalCapacities || [],
      transversalApproaches: body.transversalApproaches || [],
      sequence: body.sequence || {
        inicio: { motivation: '', priorKnowledge: '', cognitiveConflict: '', purpose: '', timeMinutes: 15 },
        desarrollo: { activities: [], methodology: '', timeMinutes: 60 },
        cierre: { metacognition: '', evaluationSummary: '', timeMinutes: 15 }
      },
      rubric: body.rubric || [],
      assessment: body.assessment || { instructions: '', questions: [] },
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }

    writeDbFile(SESSIONS_FILE, sessions);
    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    let sessions = readDbFile<SessionPlan[]>(SESSIONS_FILE, []);
    sessions = sessions.filter(s => s.id !== id);
    writeDbFile(SESSIONS_FILE, sessions);

    return NextResponse.json({ success: true, message: 'Sesión eliminada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

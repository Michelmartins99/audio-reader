import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro fornecido' },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não está configurada no servidor' },
        { status: 500 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64,
                  },
                },
                {
                  text: 'Extract all the text from this file. Return only the raw text content as it appears, preserving paragraph structure with line breaks. Do not add commentary, markdown formatting, or any explanation.',
                },
              ],
            },
          ],
        }),
      },
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message ?? 'Erro desconhecido na API Gemini';
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const blockReason = geminiData?.promptFeedback?.blockReason;
    if (blockReason) {
      return NextResponse.json(
        { error: `Conteúdo bloqueado pelo Gemini: ${blockReason}` },
        { status: 422 },
      );
    }

    const text: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Nenhum texto encontrado no ficheiro' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error('extract-text error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

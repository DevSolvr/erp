import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const defaultTemplate = (data: { clientName: string; title: string; value: string; startDate: string; endDate: string }) => `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO

Pelo presente instrumento particular, as partes abaixo identificadas celebram o presente contrato:

CONTRATANTE: ${data.clientName}
CONTRATADA: DevSolvr — Desenvolvimento de Sistemas

CLÁUSULA 1ª — DO OBJETO
A CONTRATADA compromete-se a realizar os seguintes serviços:
${data.title}

CLÁUSULA 2ª — DO VALOR
O valor total dos serviços é de ${data.value}.
O pagamento será realizado conforme acordado entre as partes.

CLÁUSULA 3ª — DOS PRAZOS
Início dos serviços: ${data.startDate}
Término estimado: ${data.endDate}

CLÁUSULA 4ª — DAS OBRIGAÇÕES DAS PARTES

Obrigações da CONTRATANTE:
• Fornecer todas as informações, materiais e acessos necessários;
• Efetuar os pagamentos nas datas acordadas;
• Revisar e aprovar as entregas dentro dos prazos estabelecidos;
• Comunicar mudanças de escopo com antecedência mínima de 5 dias úteis.

Obrigações da CONTRATADA:
• Executar os serviços com qualidade e nos prazos acordados;
• Manter sigilo total sobre as informações da CONTRATANTE;
• Comunicar imediatamente qualquer impedimento técnico ou de prazo;
• Realizar revisões e ajustes dentro do escopo contratado.

CLÁUSULA 5ª — DO SUPORTE PÓS-ENTREGA
A CONTRATADA prestará suporte técnico por 30 (trinta) dias após a entrega final, cobrindo bugs e erros de implementação. Alterações de escopo serão orçadas separadamente.

CLÁUSULA 6ª — DA PROPRIEDADE INTELECTUAL
Após a quitação integral do contrato, todos os direitos sobre o produto desenvolvido serão transferidos à CONTRATANTE.

CLÁUSULA 7ª — DA CONFIDENCIALIDADE
As partes comprometem-se a manter sigilo sobre todas as informações trocadas durante a vigência deste contrato.

CLÁUSULA 8ª — DA RESCISÃO
Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 15 (quinze) dias, com pagamento proporcional ao trabalho realizado.

CLÁUSULA 9ª — DO FORO
Fica eleito o foro da comarca do domicílio da CONTRATADA para dirimir quaisquer controvérsias oriundas deste instrumento.

______________________, _____ de ___________ de 20_____.


CONTRATANTE: ______________________________________
${data.clientName}
CPF/CNPJ: ___________________________


CONTRATADA: ______________________________________
DevSolvr — Desenvolvimento de Sistemas
`.trim();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const status = req.nextUrl.searchParams.get("status") || undefined;

  const contracts = await prisma.contract.findMany({
    where: { ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, color: true } },
      quote: { select: { id: true, number: true, title: true } },
      order: { select: { id: true, number: true, title: true } },
    },
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { title, clientName, projectId, quoteId, orderId, value, startDate, endDate, content } = body;
  if (!title || !clientName) return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  const count = await prisma.contract.count();

  const formatMoney = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const formatD = (d: string) =>
    d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "a definir";

  const contract = await prisma.contract.create({
    data: {
      number: `CON-${String(count + 1).padStart(4, "0")}`,
      title,
      clientName,
      projectId: projectId || null,
      quoteId: quoteId || null,
      orderId: orderId || null,
      status: "DRAFT",
      value: Number(value) || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      content: content || defaultTemplate({
        clientName,
        title,
        value: formatMoney(Number(value) || 0),
        startDate: formatD(startDate),
        endDate: formatD(endDate),
      }),
    },
    include: { project: true, quote: true, order: true },
  });

  return NextResponse.json(contract, { status: 201 });
}

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { getDashboard } from "@/src/db/queries/dashboard";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { MissionScrollPDF } from "@/components/pdf/mission-scroll";
import { createElement, type ReactElement } from "react";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = await getDashboard(session.user.id);

  const buffer = await renderToBuffer(
    createElement(MissionScrollPDF, { data }) as ReactElement<DocumentProps>
  );

  const filename = `shinobi-mission-scroll-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Normalizar trailing slash en API routes para evitar 307 de Vercel
  // Flow llama a veces con slash al final: /api/flow/confirmation/
  const url = req.nextUrl.clone();
  if (url.pathname !== "/" && url.pathname.endsWith("/") && url.pathname.startsWith("/api/")) {
    url.pathname = url.pathname.slice(0, -1);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

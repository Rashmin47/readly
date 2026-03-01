import { NextRequest, NextResponse } from "next/server";

const ALLOWED_SUFFIXES = [".public.blob.vercel-storage.com"];

const isAllowedHost = (hostname: string, appHost: string) => {
  if (hostname === appHost) return true;
  return ALLOWED_SUFFIXES.some(
    (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
  );
};

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return NextResponse.json(
      { error: "Missing required query parameter: url" },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { error: "Unsupported protocol" },
      { status: 400 },
    );
  }

  if (!isAllowedHost(parsedUrl.hostname, request.nextUrl.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const range = request.headers.get("range");
  const upstreamResponse = await fetch(parsedUrl.toString(), {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

  if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
    return NextResponse.json(
      { error: "Failed to fetch PDF" },
      { status: upstreamResponse.status || 502 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstreamResponse.headers.get("content-type") || "application/pdf",
  );
  headers.set("Content-Disposition", "inline");

  [
    "accept-ranges",
    "content-length",
    "content-range",
    "etag",
    "last-modified",
    "cache-control",
  ].forEach((headerName) => {
    const headerValue = upstreamResponse.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}

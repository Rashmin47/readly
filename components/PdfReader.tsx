"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  fileUrl: string;
  title: string;
}

const PdfReader = ({ fileUrl, title }: PdfReaderProps) => {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 700;
      setContainerWidth(width);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const pageWidth = useMemo(
    () => Math.max(280, Math.floor(containerWidth) - 32),
    [containerWidth],
  );

  const proxiedFileUrl = useMemo(() => {
    const params = new URLSearchParams({ url: fileUrl });
    return `/api/pdf?${params.toString()}`;
  }, [fileUrl]);

  return (
    <div className="w-full bg-white border border-(--border-subtle) rounded-[14px] p-4 sm:p-6 shadow-soft-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-(--text-primary) font-serif">
          Read PDF
        </h2>
        {numPages > 0 && (
          <span className="text-sm text-(--text-secondary) font-medium">
            {numPages} {numPages === 1 ? "page" : "pages"}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-sm text-(--text-secondary)">
          Unable to load this PDF. Open it in a new tab:{" "}
          <a
            className="underline font-medium"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            {title}
          </a>
        </p>
      ) : (
        <div
          ref={containerRef}
          className="w-full max-h-[75vh] overflow-auto bg-(--bg-tertiary) rounded-xl p-3"
        >
          <Document
            file={proxiedFileUrl}
            loading={
              <p className="text-sm text-(--text-secondary)">Loading PDF…</p>
            }
            onLoadSuccess={({ numPages: loadedPages }) => {
              setNumPages(loadedPages);
              setError(null);
            }}
            onLoadError={(loadError) => {
              console.error("PDF load error:", loadError);
              setError("Unable to load PDF");
              setNumPages(0);
            }}
          >
            <div className="flex flex-col gap-4 items-center">
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer
                  renderAnnotationLayer
                />
              ))}
            </div>
          </Document>
        </div>
      )}
    </div>
  );
};

export default PdfReader;

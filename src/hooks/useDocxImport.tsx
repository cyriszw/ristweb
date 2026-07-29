import { useState, useRef } from 'react';
import mammoth from 'mammoth';

export interface DocxTable {
  rows: string[][];
}

export function useDocxImport() {
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<DocxTable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const parseDocx = async (file: File, expectedColumns: number): Promise<DocxTable | null> => {
    setParsing(true);
    setError(null);
    setPreview(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Parse HTML tables
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = doc.querySelectorAll('table');

      if (tables.length === 0) {
        setError('No tables found in the document. Please upload a DOCX file containing a table.');
        setParsing(false);
        return null;
      }

      const table = tables[0];
      const trs = table.querySelectorAll('tr');
      const rows: string[][] = [];

      trs.forEach((tr, idx) => {
        const cells = tr.querySelectorAll('td, th');
        const row = Array.from(cells).map(c => (c.textContent || '').trim());
        // Skip header row if it looks like a header
        if (idx === 0) {
          const isHeader = row.every(c => isNaN(Number(c)) && c.length > 0);
          if (isHeader && trs.length > 1) return; // skip header
        }
        if (row.some(c => c.length > 0)) rows.push(row);
      });

      if (rows.length === 0) {
        setError('The table is empty. Please add data rows.');
        setParsing(false);
        return null;
      }

      // Validate column count
      const badRow = rows.find(r => r.length < expectedColumns);
      if (badRow) {
        setError(`Expected ${expectedColumns} column(s) but found rows with fewer. Please check your table format.`);
        setParsing(false);
        return null;
      }

      const parsed: DocxTable = { rows: rows.map(r => r.slice(0, expectedColumns)) };
      setPreview(parsed);
      setParsing(false);
      return parsed;
    } catch (e: any) {
      setError('Failed to parse the DOCX file. Please ensure it is a valid .docx document.');
      setParsing(false);
      return null;
    }
  };

  return { parsing, preview, error, reset, parseDocx, fileRef };
}

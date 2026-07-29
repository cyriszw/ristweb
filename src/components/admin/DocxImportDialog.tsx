import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import type { DocxTable } from '@/hooks/useDocxImport';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  columns: string[];
  parsing: boolean;
  preview: DocxTable | null;
  error: string | null;
  onFileSelect: (file: File) => void;
  onConfirm: () => void;
  onReset: () => void;
  children?: React.ReactNode; // extra controls like level selector
}

export default function DocxImportDialog({ open, onOpenChange, title, columns, parsing, preview, error, onFileSelect, onConfirm, onReset, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> {title}
          </DialogTitle>
        </DialogHeader>

        {children}

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to select a .docx file</p>
            <p className="text-xs text-muted-foreground mt-1">
              Table must have {columns.length} column{columns.length > 1 ? 's' : ''}: {columns.join(', ')}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) onFileSelect(f);
              }}
            />
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Parsing document...
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {preview && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Preview ({preview.rows.length} item{preview.rows.length !== 1 ? 's' : ''})
              </p>
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {columns.map(c => (
                        <th key={c} className="text-left p-2 font-medium text-foreground">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2 text-foreground">{cell || <span className="text-muted-foreground italic">empty</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {preview && (
            <Button onClick={onConfirm}>
              Import {preview.rows.length} Item{preview.rows.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Copy, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderCollageToCanvas } from '../../utils/canvasExporter';
import { ASPECT_RATIOS } from '../../utils/layoutTemplates';

export default function ExportModal({ isOpen, onClose, state }) {
  const [format, setFormat] = useState('png'); // 'png' | 'jpeg' | 'webp'
  const [scaleMultiplier, setScaleMultiplier] = useState(2); // 1, 2, 3
  const [isRendering, setIsRendering] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const aspectSpec = ASPECT_RATIOS.find((a) => a.id === state.aspectRatio) || ASPECT_RATIOS[0];
  const finalWidth = aspectSpec.width * scaleMultiplier;
  const finalHeight = aspectSpec.height * scaleMultiplier;

  // Generate live preview on setting change
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function generatePreview() {
      setIsRendering(true);
      try {
        const canvas = await renderCollageToCanvas(state, scaleMultiplier);
        if (!isMounted) return;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const url = canvas.toDataURL(mimeType, 0.95);
        setPreviewDataUrl(url);
      } catch (err) {
        console.error('Export preview generation failed:', err);
      } finally {
        if (isMounted) setIsRendering(false);
      }
    }

    generatePreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, state, scaleMultiplier, format]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const canvas = await renderCollageToCanvas(state, scaleMultiplier);
      const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const url = canvas.toDataURL(mimeType, 0.95);

      const link = document.createElement('a');
      link.download = `Chitraghar-Collage-${state.aspectRatio.replace(':', 'x')}-${Date.now()}.${format}`;
      link.href = url;
      link.click();

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const canvas = await renderCollageToCanvas(state, scaleMultiplier);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);

          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch (err) {
          console.error('Clipboard copy failed:', err);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Canvas export error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Sparkles className="w-5 h-5 text-[#c25e40]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-serif">Export High-Res Collage</h3>
              <p className="text-xs text-stone-500">Export your editorial masterpiece in crisp resolution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#faf7f2]/50">
          {/* Format & Scale Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Image Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'png', label: 'PNG', desc: 'Lossless' },
                  { id: 'jpeg', label: 'JPEG', desc: 'Compact' },
                  { id: 'webp', label: 'WebP', desc: 'Modern' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      format === f.id
                        ? 'border-[#c25e40] bg-[#c25e40] text-white font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{f.label}</div>
                    <div className="text-[10px] opacity-80">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Multiplier */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Export Scale / Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { scale: 1, label: '1x Standard', res: `${aspectSpec.width}x${aspectSpec.height}` },
                  { scale: 2, label: '2x HD Crisp', res: `${finalWidth}x${finalHeight}` },
                  { scale: 3, label: '3x Ultra Print', res: `${finalWidth}x${finalHeight}` },
                ].map((s) => (
                  <button
                    key={s.scale}
                    onClick={() => setScaleMultiplier(s.scale)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      scaleMultiplier === s.scale
                        ? 'border-[#c25e40] bg-[#c25e40] text-white font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.scale}x</div>
                    <div className="text-[10px] opacity-80 truncate">{s.res}px</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Canvas Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Export Preview</span>
              <span className="font-mono text-[#c25e40] font-bold">
                {finalWidth} × {finalHeight} px
              </span>
            </div>
            <div className="w-full h-64 bg-stone-200/60 rounded-2xl border border-stone-300 p-3 flex items-center justify-center relative overflow-hidden">
              {isRendering ? (
                <div className="flex items-center gap-2 text-[#c25e40] text-xs font-semibold animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Rendering canvas...</span>
                </div>
              ) : previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Export preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-stone-400 text-xs">Generating preview...</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-end gap-3">
          <button
            onClick={handleCopyClipboard}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-[#c25e40] hover:bg-[#a84d32] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Collage</span>
          </button>
        </div>
      </div>
    </div>
  );
}

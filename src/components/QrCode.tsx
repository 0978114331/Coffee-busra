import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeProps {
  value: string;
  size?: number;
  downloadable?: boolean;
  fileName?: string;
}

export default function QrCode({ value, size = 200, downloadable = true, fileName = 'qrcode' }: QrCodeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const downloadPng = () => {
    const svg = wrapRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size * 2;
      canvas.height = size * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${fileName}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    };
    img.src = url;
  };

  const downloadSvg = () => {
    const svg = wrapRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div ref={wrapRef} style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <QRCodeSVG value={value} size={size} level="H" includeMargin={false} />
      </div>
      {downloadable && (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-sm btn-gold" onClick={downloadPng}>PNG</button>
          <button className="btn btn-sm btn-outline" onClick={downloadSvg}>SVG</button>
          <button className="btn btn-sm btn-outline" onClick={copyLink}>{copied ? '✓' : 'Copy Link'}</button>
        </div>
      )}
    </div>
  );
}

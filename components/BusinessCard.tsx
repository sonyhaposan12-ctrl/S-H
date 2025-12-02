import React, { useState, useEffect } from 'react';
import { CardData } from '../types';
import { Phone, Mail, Globe, MapPin, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

interface BusinessCardProps {
  data: CardData;
  logoUrl: string;
  showBothSides?: boolean;
  showQrCode?: boolean;
  id?: string;
  direction?: 'row' | 'column';
}

const normalizeUrl = (url: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

const CardFront: React.FC<{ data: CardData; logoUrl: string }> = ({ data, logoUrl }) => (
  <div className="w-full h-full bg-white rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 border border-gray-100 relative shadow-sm text-center">
    <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4">
      {/* Logo Section */}
      <div className="w-32 h-32 relative flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Company Logo" 
            className="w-full h-full object-contain drop-shadow-sm"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center p-2">
            No Logo Uploaded
          </div>
        )}
      </div>
      
      {/* Company Name & Tagline */}
      <div className="text-center w-full">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight leading-none mb-1">
          {data.company}
        </h2>
        <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide mb-2">
          {data.tagline}
        </p>
        {data.description && (
          <p className="text-[9px] text-gray-500 max-w-[80%] mx-auto leading-tight">
            {data.description}
          </p>
        )}
      </div>
    </div>
  </div>
);

const CardBack: React.FC<{ data: CardData; logoUrl: string; showQrCode?: boolean }> = ({ data, logoUrl, showQrCode }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (showQrCode) {
      const websiteUrl = normalizeUrl(data.website);

      // Generate vCard data
      const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
ORG:${data.company}
TITLE:${data.title}
TEL;TYPE=WORK,VOICE:${data.phone}
EMAIL;TYPE=WORK,INTERNET:${data.email}
URL;TYPE=WORK:${websiteUrl}
ADR;TYPE=WORK:;;${data.address.replace(/\n/g, ', ')};;;;
NOTE:${data.description}
END:VCARD`;

      QRCode.toDataURL(vCardData, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
    }
  }, [data, showQrCode]);

  const handleCopy = (e: React.MouseEvent, text: string, field: string) => {
    e.stopPropagation(); // Prevent card flip
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVisitWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = normalizeUrl(data.website);
    if (url) window.open(url, '_blank');
  };

  return (
    <div 
      className="w-full h-full rounded-xl overflow-hidden flex flex-col p-6 text-white shadow-sm relative"
      style={{ backgroundColor: '#5D4B78' }} // Ungu Dove (Muted Purple)
    >
        {/* Pattern Overlay (Subtle) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>

        {/* Watermark Logo */}
        {logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
             <img 
               src={logoUrl} 
               className="w-64 h-64 object-contain opacity-5 grayscale transform -rotate-12 scale-150 mix-blend-screen" 
               alt="Watermark" 
             />
          </div>
        )}

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        <div>
          <h1 className="text-lg font-bold tracking-wide">{data.name}</h1>
          <p className="text-[10px] text-yellow-400 font-medium uppercase tracking-wider mt-1">{data.title}</p>
          <div className="w-12 h-1 bg-yellow-400 mt-3 rounded-full"></div>
          
          {/* CTA Button */}
          <button
            onClick={handleVisitWebsite}
            className="mt-4 flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#5D4B78] px-3 py-1.5 rounded-full text-[9px] font-bold shadow-md transition-all transform hover:scale-105 active:scale-95"
            title="Visit Website"
          >
            <span>Visit Website</span>
            <ExternalLink size={10} strokeWidth={3} />
          </button>
        </div>

        <div className="flex justify-between items-end mt-2">
          <div className="space-y-2 z-10 flex-1 min-w-0 pr-2">
            
            <div className="flex items-center space-x-2 text-[9px] group">
              <div className="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                <Phone size={10} className="text-yellow-400 animate-pulse" />
              </div>
              <span className="font-light tracking-wide truncate">{data.phone}</span>
            </div>
            
            {/* Email - Click to copy */}
            <div 
              className="flex items-center space-x-2 text-[9px] group cursor-pointer hover:bg-white/10 rounded p-1 -ml-1 transition-all duration-300 ease-in-out"
              onClick={(e) => handleCopy(e, data.email, 'email')}
              title="Click to copy email"
            >
              <div className="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                <Mail size={10} className="text-yellow-400" />
              </div>
              <span className="font-light tracking-wide break-all flex-1">{data.email}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out flex-shrink-0 ml-1">
                 {copiedField === 'email' ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-gray-300" />}
              </div>
            </div>

            {/* Website - Explicit Copy Button */}
            <div className="flex items-center space-x-2 text-[9px] group">
              <div className="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                <Globe size={10} className="text-yellow-400" />
              </div>
              <span className="font-light tracking-wide break-all flex-1">{data.website}</span>
              
              <button 
                onClick={(e) => handleCopy(e, data.website, 'website')}
                className="p-1.5 hover:bg-white/20 rounded-md transition-all text-gray-300 hover:text-white flex-shrink-0"
                title="Copy Website URL"
              >
                {copiedField === 'website' ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
              </button>
            </div>

            {data.address && (
              <div className="flex items-start space-x-2 text-[8px]">
                <div className="p-1.5 bg-white/10 rounded-full flex-shrink-0 mt-0.5">
                  <MapPin size={10} className="text-yellow-400" />
                </div>
                <span className="font-light tracking-wide whitespace-pre-wrap leading-tight">{data.address}</span>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {showQrCode && qrUrl && (
            <div className="bg-white p-1 rounded-lg shadow-lg z-20 flex-shrink-0 ml-1">
              <img src={qrUrl} alt="Contact QR" className="w-16 h-16 object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BusinessCard: React.FC<BusinessCardProps> = ({ data, logoUrl, showBothSides, showQrCode, id, direction = 'column' }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (showBothSides) {
    return (
      <div id={id} className={`bg-white p-8 flex ${direction === 'row' ? 'flex-row' : 'flex-col'} items-center gap-8 w-fit mx-auto`}>
        <div className="w-[400px] h-[240px] shadow-lg rounded-xl">
          <CardFront data={data} logoUrl={logoUrl} />
        </div>
        <div className="w-[400px] h-[240px] shadow-lg rounded-xl">
          <CardBack data={data} logoUrl={logoUrl} showQrCode={showQrCode} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] h-[240px] perspective-1000 relative group cursor-pointer" onClick={handleFlip}>
      <div 
        className={`w-full h-full relative transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform-style-3d shadow-xl group-hover:shadow-2xl rounded-xl ${isFlipped ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(10deg)_rotateX(2deg)_scale(1.02)]'}`}
      >
        {/* --- FRONT SIDE --- */}
        <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden">
           <CardFront data={data} logoUrl={logoUrl} />
           <div className="absolute bottom-4 right-4 text-gray-300 z-20">
            <RefreshCw size={16} />
          </div>
        </div>

        {/* --- BACK SIDE --- */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden">
          <CardBack data={data} logoUrl={logoUrl} showQrCode={showQrCode} />
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;

import React, { useState, useRef } from 'react';
import BusinessCard from './components/BusinessCard';
import { CardData } from './types';
import { editImageWithGemini } from './services/geminiService';
import { Upload, Sparkles, Loader2, RotateCcw, FileText, Image as ImageIcon, QrCode, User, Building2, FileCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const App: React.FC = () => {
  // Hardcoded data based on user request, now mutable
  const [cardData, setCardData] = useState<CardData>({
    name: 'Frianti',
    title: 'Sales Manager',
    phone: '+62 812-6695-1503',
    email: 'sales@joseraglobalitsolusindo.com',
    company: 'PT Josera Global Solusindo',
    tagline: '“Empowering Growth, Nurturing Future”',
    website: 'www.joseraglobalitsolusindo.com',
    address: 'Grand Galaxy City, RGA 53, Bekasi',
    description: 'Providing comprehensive IT solutions and services.'
  });

  // Placeholder Logo (Using a generic business icon as fallback)
  const [logo, setLogo] = useState<string>('https://picsum.photos/200/200'); 
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(true);
  
  // History for undo
  const [imageHistory, setImageHistory] = useState<string[]>(['https://picsum.photos/200/200']);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogo(result);
        setImageHistory([result]); // Reset history on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIEdit = async () => {
    if (!prompt.trim()) return;
    if (!logo) {
      setError("Please upload a logo/image first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const newImage = await editImageWithGemini(logo, prompt);
      setLogo(newImage);
      setImageHistory(prev => [...prev, newImage]);
      setPrompt(''); // Clear prompt on success
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (imageHistory.length > 1) {
      const newHistory = [...imageHistory];
      newHistory.pop(); // Remove current
      const previousImage = newHistory[newHistory.length - 1];
      setLogo(previousImage);
      setImageHistory(newHistory);
    }
  };

  const handleDownloadJPEG = async () => {
    if (exportRef.current) {
      try {
        const canvas = await html2canvas(exportRef.current, { 
          scale: 3, // Higher quality
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = `josera-card-${cardData.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      } catch (err) {
        console.error("Error generating JPEG:", err);
        setError("Failed to generate JPEG. Please try again.");
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (exportRef.current) {
      try {
        const canvas = await html2canvas(exportRef.current, { 
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Initialize PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 20, imgWidth, imgHeight);
        pdf.save(`josera-card-${cardData.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      } catch (err) {
         console.error("Error generating PDF:", err);
         setError("Failed to generate PDF. Please try again.");
      }
    }
  };

  const handleDownloadHTML = async () => {
    try {
      // 1. Generate QR Code Data URL with enhanced vCard
      let qrUrl = '';
      if (showQrCode) {
        const normalizeUrl = (url: string) => {
            if (!url) return '';
            return url.startsWith('http') ? url : `https://${url}`;
          };
        const websiteUrl = normalizeUrl(cardData.website);
        
        const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${cardData.name}
ORG:${cardData.company}
TITLE:${cardData.title}
TEL;TYPE=WORK,VOICE:${cardData.phone}
EMAIL;TYPE=WORK,INTERNET:${cardData.email}
URL;TYPE=WORK:${websiteUrl}
ADR;TYPE=WORK:;;${cardData.address.replace(/\n/g, ', ')};;;;
NOTE:${cardData.description}
END:VCARD`;
        qrUrl = await QRCode.toDataURL(vCardData, { margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });
      }

      // 2. Construct HTML String
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cardData.name} - Digital Business Card</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .card-inner { transition: transform 0.8s; }
        .flipped { transform: rotateY(180deg); }
    </style>
</head>
<body>
    <div class="perspective-1000 w-full max-w-[400px] h-[240px] cursor-pointer group" onclick="this.querySelector('.card-inner').classList.toggle('flipped')">
        <div class="card-inner relative w-full h-full transform-style-3d shadow-xl rounded-xl bg-white">
            <!-- Front -->
            <div class="absolute w-full h-full backface-hidden rounded-xl overflow-hidden bg-white border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
                 <!-- Logo -->
                 <div class="w-32 h-32 relative flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
                    ${logo ? `<img src="${logo}" class="w-full h-full object-contain drop-shadow-sm" />` : ''}
                 </div>
                 <!-- Text -->
                 <div>
                    <h2 class="text-lg font-bold text-gray-800 tracking-tight leading-none mb-1">${cardData.company}</h2>
                    <p class="text-[10px] text-red-500 font-semibold uppercase tracking-wide mb-2">${cardData.tagline}</p>
                    <p class="text-[9px] text-gray-500 max-w-[80%] mx-auto leading-tight">${cardData.description}</p>
                 </div>
                 <div class="absolute bottom-4 right-4 text-gray-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                 </div>
            </div>

            <!-- Back -->
            <div class="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden p-8 text-white flex flex-col justify-between" style="background-color: #5D4B78;">
                <!-- Pattern -->
                <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 20px 20px;"></div>
                <!-- Watermark -->
                <div class="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                    ${logo ? `<img src="${logo}" class="w-64 h-64 object-contain opacity-5 grayscale transform -rotate-12 scale-150 mix-blend-screen" />` : ''}
                </div>
                
                <div class="relative z-10">
                    <h1 class="text-xl font-bold tracking-wide">${cardData.name}</h1>
                    <p class="text-xs text-yellow-400 font-medium uppercase tracking-wider mt-1">${cardData.title}</p>
                    <div class="w-12 h-1 bg-yellow-400 mt-3 rounded-full"></div>
                </div>

                <div class="relative z-10 flex justify-between items-end mt-2">
                    <div class="space-y-2 flex-1 min-w-0 pr-2">
                        <!-- Phone -->
                        <div class="flex items-center space-x-3 text-[10px]">
                            <div class="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <span class="font-light tracking-wide truncate">${cardData.phone}</span>
                        </div>
                        <!-- Email -->
                        <div class="flex items-center space-x-3 text-[10px]">
                            <div class="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </div>
                            <span class="font-light tracking-wide truncate">${cardData.email}</span>
                        </div>
                        <!-- Website -->
                        <div class="flex items-center space-x-3 text-[10px]">
                            <div class="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            </div>
                            <span class="font-light tracking-wide truncate">${cardData.website}</span>
                        </div>
                        <!-- Address -->
                        <div class="flex items-start space-x-3 text-[10px]">
                            <div class="p-1.5 bg-white/10 rounded-full flex-shrink-0 mt-0.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                            <span class="font-light tracking-wide text-[8px] leading-tight whitespace-pre-wrap">${cardData.address}</span>
                        </div>
                    </div>
                    <!-- QR Code -->
                    ${qrUrl ? `<div class="bg-white p-1 rounded-lg shadow-lg z-20 flex-shrink-0 ml-1"><img src="${qrUrl}" class="w-16 h-16 object-contain" /></div>` : ''}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

      // 3. Download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `josera-card-${cardData.name.replace(/\s+/g, '-').toLowerCase()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error generating HTML:", err);
      setError("Failed to generate HTML card.");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col md:flex-row">
      
      {/* Hidden Export Container */}
      <div className="fixed -top-[9999px] left-0 w-[max-content] z-[-1]">
        <div ref={exportRef} className="inline-block">
           <BusinessCard data={cardData} logoUrl={logo} showBothSides={true} showQrCode={showQrCode} direction="row" />
        </div>
      </div>

      {/* Sidebar / Control Panel */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 p-6 flex flex-col overflow-y-auto h-auto md:h-screen z-10 shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Josera Editor</h1>
          <p className="text-xs text-gray-500">Powered by Gemini 2.5 Flash Image</p>
        </div>

        {/* Personal Details Section */}
        <div className="mb-6 border-b border-gray-100 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User size={16} className="text-indigo-500" />
              Personal Details
          </label>
          <div className="space-y-3">
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                  <input
                      type="text"
                      name="name"
                      value={cardData.name}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter full name"
                  />
              </div>
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
                  <input
                      type="text"
                      name="title"
                      value={cardData.title}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter job title"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                  <input
                      type="tel"
                      name="phone"
                      value={cardData.phone}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter phone number"
                  />
              </div>
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email Address</label>
                  <input
                      type="email"
                      name="email"
                      value={cardData.email}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter email address"
                  />
              </div>
          </div>
        </div>

        {/* Company Details Section */}
        <div className="mb-6 border-b border-gray-100 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" />
              Company Details
          </label>
          <div className="space-y-3">
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
                  <input
                      type="text"
                      name="company"
                      value={cardData.company}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter company name"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tagline</label>
                  <input
                      type="text"
                      name="tagline"
                      value={cardData.tagline}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter tagline"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Website</label>
                  <input
                      type="text"
                      name="website"
                      value={cardData.website}
                      onChange={handleInputChange}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. www.example.com"
                  />
              </div>
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Address</label>
                  <textarea
                      name="address"
                      value={cardData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                      placeholder="Full office address"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
                  <textarea
                      name="description"
                      value={cardData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                      placeholder="Brief description (optional)"
                  />
              </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
             <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="flex flex-col items-center">
              <Upload className="text-gray-400 mb-2" size={24} />
              <span className="text-sm text-gray-500">Click to upload logo</span>
            </div>
          </div>
        </div>

        {/* AI Edit Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500" />
            AI Design Studio
          </label>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Make the logo background transparent' or 'Add a golden glow effect'"
              className="w-full text-sm p-3 rounded-md border-gray-200 border focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3 resize-none h-24"
            />
            
            <button
              onClick={handleAIEdit}
              disabled={isProcessing || !prompt}
              className={`w-full py-2.5 rounded-md text-white text-sm font-medium flex items-center justify-center gap-2 transition-all
                ${isProcessing || !prompt 
                  ? 'bg-indigo-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Magic
                </>
              )}
            </button>
            
            {error && (
              <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">{error}</p>
            )}
          </div>
        </div>

         {/* Options Section */}
         <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Options</label>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
             <div className="flex items-center gap-2 text-sm text-gray-600">
               <QrCode size={18} />
               <span>Include Contact QR</span>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showQrCode} 
                onChange={() => setShowQrCode(!showQrCode)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

         {/* Download Section */}
         <div className="mb-6 flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Card</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 gap-2"
            >
              <FileText size={20} className="text-red-500" />
              <span>Download PDF</span>
            </button>
             <button 
              onClick={handleDownloadJPEG}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 gap-2"
            >
              <ImageIcon size={20} className="text-blue-500" />
              <span>Download JPEG</span>
            </button>
            <button 
              onClick={handleDownloadHTML}
              className="col-span-2 flex flex-row items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 gap-2"
            >
              <FileCode size={20} className="text-green-500" />
              <span>Download Interactive HTML (Flip)</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          <button 
            onClick={handleUndo}
            disabled={imageHistory.length <= 1}
            className={`w-full flex items-center justify-center gap-2 py-2 border rounded-md text-sm font-medium transition-colors
              ${imageHistory.length <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            <RotateCcw size={16} />
            Undo Last Edit
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="z-10 flex flex-col items-center w-full">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Live Preview</h2>
            <p className="text-gray-500 text-sm">Tap the card to flip between front and back.</p>
          </div>

          <BusinessCard data={cardData} logoUrl={logo} showQrCode={showQrCode} />

          <div className="mt-12 text-center max-w-md text-sm text-gray-400">
             <p>This digital card is optimized for mobile viewing.</p>
             <p className="mt-1">Generated for: {cardData.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

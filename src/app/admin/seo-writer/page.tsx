'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const TOPIC_PRESETS = [
  {
    title: 'Sekumpul Waterfall & Munduk Lake Descent',
    keywords: 'Sekumpul waterfall, Munduk twin lakes, Bedugul roadtrip, Bali highlands, North Bali waterfalls',
    persona: 'Adventure & Nature Explorers',
    tone: 'Slow travel, rich detailed guides with exact prices, driving routes, and physical difficulty levels.'
  },
  {
    title: 'The Ultimate Guide to Snorkeling in Lovina Reef',
    keywords: 'Lovina reef snorkeling, swim with sea turtles Bali, Lovina coral garden, Bali wild sea turtles',
    persona: 'Marine Enthusiasts & Slow Travelers',
    tone: 'Expert, highly practical, focusing on sanitized gear, local warung spots, and zero-chase environmental ethics.'
  },
  {
    title: 'Canggu to Lovina: The Scenic 3-Day Volcanic Roadtrip',
    keywords: 'Canggu to Lovina, Bali roadtrip itinerary, Banjar hot springs, Bedugul strawberries, Munduk villas',
    persona: 'Aesthetic Travelers & Couples',
    tone: 'Sophisticated, premium, editorially styled with romantic sunset viewpoints and boutique dining locations.'
  }
];

export default function SeoWriterPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Key and Form states
  const [apiKey, setApiKey] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [persona, setPersona] = useState('Conscious Explorer');
  const [tone, setTone] = useState('Finns-style Travel Authority');
  const [personalExperience, setPersonalExperience] = useState('');

  // Metadata states (for publishing)
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('Bali Dolphin Tours Team');
  const [tagsInput, setTagsInput] = useState('');
  const [takeawaysInput, setTakeawaysInput] = useState('');
  const [faqsInput, setFaqsInput] = useState('');
  
  // Generation & Workspace states
  const [generating, setGenerating] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Publishing states
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishedDocId, setPublishedDocId] = useState('');

  // Auto-load keys on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('lovina_writer_key');
      const savedAuth = localStorage.getItem('lovina_admin_auth');
      if (savedKey) setApiKey(savedKey);
      if (savedAuth === 'true') setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'lovina-sea-2026') {
      setIsAuthenticated(true);
      setPasswordError(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lovina_admin_auth', 'true');
      }
    } else {
      setPasswordError(true);
    }
  };

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lovina_writer_key', key);
    }
  };

  const selectPreset = (preset: typeof TOPIC_PRESETS[0]) => {
    setTopic(preset.title);
    setKeywords(preset.keywords);
    setPersona(preset.persona);
    setTone(preset.tone);
  };

  // Generate automated excerpt when markdown is loaded
  useEffect(() => {
    if (markdown) {
      // Find first normal paragraph
      const firstParagraph = markdown
        .split('\n')
        .map(line => line.trim())
        .find(line => line && !line.startsWith('#') && !line.startsWith(':') && !line.startsWith('*') && !/^\d+\./.test(line));
      
      if (firstParagraph) {
        setExcerpt(firstParagraph.substring(0, 160) + '...');
      } else {
        setExcerpt(`Explore ${topic} with Bali Dolphin Tours's expert travel guide.`);
      }
    }
  }, [markdown, topic]);

  // Simulated loading steps for luxurious visual feedback during AI compilation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (generating) {
      const steps = [
        'Mapping North Bali coordinates and local warung spots...',
        'Weaving in your personal travel experiences and stories...',
        'Compiling 1,500+ words of helpful, non-fluff travel advice...',
        'Injecting high-converting CRO dolphin tour callouts...',
        'Drafting photorealistic Midjourney & Flux camera lens prompts...',
        'Optimizing heading hierarchy and search keyword densities...',
        'Polishing editorial tone to Finns Beach Club authority standards...'
      ];
      
      const nextStep = () => {
        setLoadingStep((prev) => {
          if (prev < steps.length - 1) {
            timer = setTimeout(nextStep, 3500);
            return prev + 1;
          }
          return prev;
        });
      };
      
      timer = setTimeout(nextStep, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearTimeout(timer);
  }, [generating]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError('');
    setMarkdown('');
    setPublishSuccess(false);

    try {
      const response = await fetch('/api/seo-writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, topic, keywords, persona, tone, personalExperience }),
      });

      const data = await response.json();
      if (data.error) {
        setGenerationError(data.error);
      } else {
        if (data.markdown) setMarkdown(data.markdown);
        if (data.tags) setTagsInput(data.tags.join(', '));
        if (data.keyTakeaways) setTakeawaysInput(data.keyTakeaways.join('\n'));
        if (data.faqs) {
          const faqStr = data.faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
          setFaqsInput(faqStr);
        }
      }
    } catch (err: any) {
      setGenerationError(err.message || 'An error occurred during AI generation.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!markdown) return;
    setPublishing(true);
    setPublishError('');
    setPublishSuccess(false);

    // Extract Title from markdown (first H1 line starting with # )
    const titleLine = markdown.split('\n').find(l => l.trim().startsWith('# '));
    const title = titleLine ? titleLine.replace('# ', '').trim() : topic;
    
    // Generate clean URL slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-') // spaces to dashes
      .replace(/-+/g, '-') // collapse consecutive dashes
      .trim();

    // Split and filter inputs
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const keyTakeaways = takeawaysInput.split('\n').map(t => t.trim()).filter(Boolean);
    
    // Parse FAQs input back to array of objects
    const faqs: { question: string; answer: string }[] = [];
    const faqLines = faqsInput.split('\n').map(l => l.trim()).filter(Boolean);
    let currentFaq: { question: string; answer: string } | null = null;
    for (const line of faqLines) {
      const upper = line.toUpperCase();
      if (upper.startsWith('Q:') || upper.startsWith('QUESTION:')) {
        if (currentFaq) faqs.push(currentFaq);
        const qText = line.replace(/^(Q|Question):/i, '').trim();
        currentFaq = { question: qText, answer: '' };
      } else if ((upper.startsWith('A:') || upper.startsWith('ANSWER:')) && currentFaq) {
        const aText = line.replace(/^(A|Answer):/i, '').trim();
        currentFaq.answer = aText;
      } else if (currentFaq) {
        currentFaq.answer = (currentFaq.answer + ' ' + line).trim();
      }
    }
    if (currentFaq) faqs.push(currentFaq);

    try {
      const response = await fetch('/api/seo-writer/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          slug, 
          markdown, 
          excerpt, 
          author,
          tags,
          keyTakeaways,
          faqs
        }),
      });

      const data = await response.json();
      if (data.error) {
        setPublishError(data.error);
      } else if (data.success) {
        setPublishSuccess(true);
        setPublishedDocId(data.docId);
      }
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish to Sanity.');
    } finally {
      setPublishing(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lovina_admin_auth');
    }
  };

  // Render HTML preview of the generated markdown (custom lightweight parser)
  const renderPreview = () => {
    if (!markdown) return null;

    const sections = markdown.split('\n');
    let inCroBox = false;
    let inImagePrompt = false;
    let croLines: string[] = [];
    let imageLines: string[] = [];

    // Parse headings for live interactive Table of Contents sidebar
    const headings = sections
      .filter(line => line.trim().startsWith('### ') || line.trim().startsWith('#### '))
      .map(line => {
        const isH3 = line.trim().startsWith('### ');
        const text = line.replace(/^(###|####)\s+/, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
        return { text, id, style: isH3 ? 'h3' : 'h4' };
      });

    const wordCount = sections.join(' ').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Styled Content */}
        <div className="xl:col-span-8 space-y-6 text-sm text-deep-indigo/80 font-light leading-relaxed">
          {sections.map((line, idx) => {
            const trimmed = line.trim();

            // Match CRO block syntax
            if (trimmed === ':::cro-box') {
              inCroBox = true;
              croLines = [];
              return null;
            }
            if (trimmed === ':::') {
              if (inCroBox) {
                inCroBox = false;
                // Render CRO Callout
                const croTitle = croLines.find(l => l.startsWith('### '))?.replace('### ', '') || 'Ready to Book?';
                const croText = croLines.filter(l => !l.startsWith('### ') && !l.startsWith('['))[0] || '';
                return (
                  <div key={idx} className="bg-transformative-teal/5 p-6 rounded-3xl border border-transformative-teal/15 my-6 animate-in zoom-in duration-300">
                    <h4 className="text-lg font-serif text-transformative-teal font-bold mb-2">🐢 {croTitle}</h4>
                    <p className="text-xs text-deep-indigo/80 mb-4">{croText}</p>
                    <Link href="/tours" className="inline-block bg-coral-pop text-cloud-dancer px-6 py-2 rounded-full text-xs font-bold hover:bg-deep-indigo transition-all">
                      Book Your Private Boat Tour Now
                    </Link>
                  </div>
                );
              }
              if (inImagePrompt) {
                inImagePrompt = false;
                // Render Image Prompt Capsule
                const promptText = imageLines.join(' ');
                return (
                  <div key={idx} className="bg-cloud-dancer/50 p-5 rounded-2xl border border-deep-indigo/10 border-dashed my-5">
                    <span className="text-[9px] font-bold text-coral-pop uppercase tracking-wider block mb-1">📸 Midjourney / Flux Lens Asset Prompt</span>
                    <p className="text-[11px] text-deep-indigo/60 italic font-mono bg-white p-3 rounded-lg border border-deep-indigo/5 mb-3 leading-normal select-all">
                      {promptText.replace('**Midjourney Image Prompt:**', '').trim()}
                    </p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(promptText.replace('**Midjourney Image Prompt:**', '').trim());
                        alert('Prompt copied to clipboard!');
                      }}
                      className="text-[10px] font-bold text-transformative-teal hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      📋 Copy Lens Prompt
                    </button>
                  </div>
                );
              }
              return null;
            }

            if (inCroBox) {
              croLines.push(trimmed);
              return null;
            }

            if (trimmed === ':::image-prompt') {
              inImagePrompt = true;
              imageLines = [];
              return null;
            }

            if (inImagePrompt) {
              imageLines.push(trimmed);
              return null;
            }

            // Render Normal Markdown Tags
            if (trimmed.startsWith('# ')) {
              return <h1 key={idx} className="text-3xl font-serif text-deep-indigo mt-8 mb-4 border-b border-deep-indigo/10 pb-2">{trimmed.substring(2)}</h1>;
            }
            if (trimmed.startsWith('## ')) {
              const text = trimmed.substring(3);
              const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
              return <h2 key={idx} id={id} className="text-2xl font-serif text-deep-indigo mt-6 mb-3 scroll-mt-20">{text}</h2>;
            }
            if (trimmed.startsWith('### ')) {
              const text = trimmed.substring(4);
              const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
              return <h3 key={idx} id={id} className="text-xl font-serif text-deep-indigo mt-6 mb-2 scroll-mt-20">{text}</h3>;
            }
            if (trimmed.startsWith('#### ')) {
              const text = trimmed.substring(5);
              const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
              return <h4 key={idx} id={id} className="text-base font-serif text-deep-indigo mt-4 mb-2 scroll-mt-20">{text}</h4>;
            }
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
              return <li key={idx} className="list-disc list-inside pl-4 text-xs">{trimmed.substring(2)}</li>;
            }
            if (/^\d+\.\s+/.test(trimmed)) {
              return <li key={idx} className="list-decimal list-inside pl-4 text-xs">{trimmed.replace(/^\d+\.\s+/, '')}</li>;
            }

            // Bold rendering helper
            if (trimmed) {
              return <p key={idx} className="mb-4 text-xs leading-relaxed" dangerouslySetInnerHTML={{
                __html: trimmed
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }} />;
            }

            return null;
          })}
        </div>

        {/* Right Column: Visual Summary & TOC Sidebar */}
        <div className="hidden xl:block xl:col-span-4 sticky top-6 space-y-6">
          <div className="bg-cloud-dancer/50 p-6 rounded-[2rem] border border-deep-indigo/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-deep-indigo/10 pb-3">
              <span className="text-[10px] font-bold text-coral-pop uppercase tracking-widest">
                📋 Visual Highlights
              </span>
              <span className="text-[10px] text-deep-indigo/50 font-bold bg-white px-2.5 py-1 rounded-md border border-deep-indigo/5">
                ⏱️ {readingTime} min read
              </span>
            </div>

            {/* Render Takeaways Bullet Summary box */}
            {takeawaysInput.split('\n').map(t => t.trim()).filter(Boolean).length > 0 && (
              <div className="space-y-3 bg-transformative-teal/5 p-4 rounded-2xl border border-transformative-teal/10 animate-in fade-in duration-300">
                <span className="text-[10px] font-bold text-transformative-teal block border-b border-transformative-teal/10 pb-1.5 uppercase tracking-wider">🎯 Chapter Summaries</span>
                <ul className="space-y-2 text-[10px] leading-relaxed">
                  {takeawaysInput.split('\n').map(t => t.trim()).filter(Boolean).map((takeaway, i) => {
                    const heading = headings[i];
                    return (
                      <li key={i} className="text-deep-indigo/80">
                        {heading ? (
                          <a href={`#${heading.id}`} className="hover:text-transformative-teal hover:underline flex items-start gap-1.5 font-light">
                            <span>💡</span>
                            <span>{takeaway}</span>
                          </a>
                        ) : (
                          <div className="flex items-start gap-1.5 font-light">
                            <span>💡</span>
                            <span>{takeaway}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {headings.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-deep-indigo block">Table of Contents</span>
                <ul className="space-y-2.5 text-[11px] leading-tight">
                  {headings.map((h, i) => (
                    <li key={i} className={`${h.style === 'h4' ? 'pl-4 text-deep-indigo/50' : 'font-semibold text-deep-indigo/70'}`}>
                      <a href={`#${h.id}`} className="hover:text-transformative-teal hover:underline transition-all flex items-start gap-1">
                        <span>•</span>
                        <span>{h.text}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-deep-indigo/5 pt-4 space-y-2 bg-white/40 p-4 rounded-2xl border border-white/20">
              <span className="text-[10px] font-bold text-deep-indigo block">SEO Writer Tips</span>
              <p className="text-[10px] text-deep-indigo/60 font-light leading-normal">
                Key takeaways are linked to the corresponding H3 headings dynamically. Clicking any summary bullet point or TOC item scrolls the traveler to that exact paragraph!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Auth Protection Gate Overlay
  if (!isAuthenticated) {
    return (
      <main className="bg-cloud-dancer min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-lg border border-deep-indigo/10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-transformative-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🔒
          </div>
          <h1 className="text-3xl font-serif text-deep-indigo mb-2">Admin Dashboard</h1>
          <p className="text-xs text-deep-indigo/50 mb-6">Enter your security key to access the Lovina SEO Travel Writer</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password"
              placeholder="Admin Security Password"
              required
              className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 text-center focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {passwordError && (
              <p className="text-xs text-coral-pop font-bold bg-coral-pop/5 py-2 px-4 rounded-xl">❌ Access Denied: Invalid Security Key</p>
            )}
            <button 
              type="submit"
              className="w-full bg-coral-pop text-cloud-dancer py-4 rounded-full text-sm font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Unlock Terminal
            </button>
          </form>
          
          <p className="text-[10px] text-deep-indigo/30 mt-6 font-mono">BALI DOLPHIN TOURS CO. 2026</p>
        </div>
      </main>
    );
  }

  const stepsList = [
    'Mapping North Bali coordinates and local warung spots...',
    'Weaving in your personal travel experiences and stories...',
    'Compiling 1,500+ words of helpful, non-fluff travel advice...',
    'Injecting high-converting CRO dolphin tour callouts...',
    'Drafting photorealistic Midjourney & Flux camera lens prompts...',
    'Optimizing heading hierarchy and search keyword densities...',
    'Polishing editorial tone to Finns Beach Club authority standards...'
  ];

  return (
    <main className="bg-cloud-dancer min-h-screen px-4 sm:px-6 py-10 lg:px-12 font-sans text-deep-indigo">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-deep-indigo/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-transformative-teal bg-transformative-teal/10 px-3 py-1 rounded-md">PRO EDITION</span>
              <span className="w-2 h-2 bg-transformative-teal rounded-full animate-ping" />
            </div>
            <h1 className="text-4xl font-serif text-deep-indigo">SEO Blog Writer & Publisher</h1>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin" 
              className="bg-white border border-deep-indigo/10 text-deep-indigo px-5 py-2.5 rounded-full text-xs font-bold hover:bg-cloud-dancer/50 transition-all shadow-sm"
            >
              Open Sanity Studio
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-deep-indigo text-cloud-dancer px-5 py-2.5 rounded-full text-xs font-bold hover:bg-coral-pop transition-all shadow-sm cursor-pointer"
            >
              Lock Terminal
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Prompt Parameters (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Setup Block */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-deep-indigo/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-deep-indigo/40 border-b border-deep-indigo/5 pb-2">AI Configuration</h3>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">Gemini or OpenAI API Key (Optional)</label>
                <input 
                  type="password"
                  placeholder="Optional (using secure pre-configured backend key if empty)"
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-transformative-teal text-xs text-deep-indigo font-mono"
                  value={apiKey}
                  onChange={(e) => handleSaveKey(e.target.value)}
                />
                <span className="text-[9px] text-deep-indigo/40 mt-1.5 block">Stored securely in your browser sandbox. Leave empty to use the server's default pre-configured key.</span>
              </div>
            </div>

            {/* Presets Block */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-deep-indigo/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-deep-indigo/40 border-b border-deep-indigo/5 pb-2">Finns-Style Presets</h3>
              <div className="space-y-3">
                {TOPIC_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => selectPreset(preset)}
                    className="w-full text-left bg-cloud-dancer/30 hover:bg-transformative-teal/5 p-4 rounded-2xl border border-deep-indigo/5 hover:border-transformative-teal/20 transition-all text-xs"
                  >
                    <span className="font-serif font-bold text-deep-indigo block mb-1">✍️ {preset.title}</span>
                    <span className="text-[10px] text-deep-indigo/50 font-light line-clamp-1">Keywords: {preset.keywords}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Writer Parameters Form */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-deep-indigo/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-deep-indigo/40 border-b border-deep-indigo/5 pb-2">Prompt Parameters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">Blog Topic / H1 Title Goal</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. The Ultimate Guide to Munduk Waterfalls & Highlands"
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-transformative-teal text-xs text-deep-indigo resize-none"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">Focus Keywords (Comma separated)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Munduk waterfalls, Bali highlands, hiking Bali"
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-transformative-teal text-xs text-deep-indigo"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                {/* Personal Experience anecdotes Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60">
                      My Real Experiences (E-E-A-T Booster)
                    </label>
                    <span className="text-[8px] font-bold text-transformative-teal uppercase bg-transformative-teal/10 px-2 py-0.5 rounded-md border border-transformative-teal/10">
                      High Ranking
                    </span>
                  </div>
                  <textarea 
                    rows={3}
                    placeholder="Provide your personal anecdotes here! E.g. 'I stayed at Munduk Eco Cabins, Gede was our driver, took 2.5 hours from Canggu. We ate grilled Red Snapper at Warung Nemo and the satay was incredible!'"
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-transformative-teal text-xs text-deep-indigo resize-none leading-normal font-light"
                    value={personalExperience}
                    onChange={(e) => setPersonalExperience(e.target.value)}
                  />
                  <span className="text-[9px] text-deep-indigo/40 mt-1 block">Real quotes & details satisfy Google's strict helpful content guidelines and index much faster.</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">Traveler Persona</label>
                    <select
                      className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-transformative-teal text-xs text-deep-indigo cursor-pointer"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                    >
                      <option value="Conscious Explorer">Conscious Explorer</option>
                      <option value="Luxury Villa Guest">Luxury Villa Guest</option>
                      <option value="Slow-Travel Family">Slow-Travel Family</option>
                      <option value="Aesthetic Backpacker">Aesthetic Backpacker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">Editorial Style</label>
                    <select
                      className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-transformative-teal text-xs text-deep-indigo cursor-pointer"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      <option value="Finns-style Travel Authority">Finns-Style (Rich Listicles)</option>
                      <option value="Boutique Luxury Editorial">Boutique Luxury Editorial</option>
                      <option value="Practical Backpacker Route">Practical Backpacker Route</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !topic}
                  className="w-full bg-coral-pop text-cloud-dancer py-4 rounded-full text-xs font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {generating ? 'Drafting Article...' : 'Generate Rich Authority Post (AI)'}
                </button>

                {generationError && (
                  <p className="text-xs text-coral-pop bg-coral-pop/5 py-2 px-4 rounded-xl leading-normal">❌ AI Writer Error: {generationError}</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Block: Live Editor & visual Preview workspace (7 cols) */}
          <div className="lg:col-span-7 h-[70vh] lg:h-[80vh] flex flex-col">
            
            {generating ? (
              /* Luxurious Generating Screen */
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-deep-indigo/5 flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-transformative-teal/15 rounded-full flex items-center justify-center text-4xl animate-bounce">
                  🌴
                </div>
                <h3 className="text-2xl font-serif text-deep-indigo">AI Travel Writer Compiling...</h3>
                
                {/* Active Loading step */}
                <div className="max-w-md w-full bg-cloud-dancer/50 px-6 py-4 rounded-2xl border border-deep-indigo/5 text-xs text-transformative-teal font-medium tracking-wide animate-pulse">
                  {stepsList[loadingStep]}
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2.5">
                  {stepsList.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= loadingStep ? 'bg-transformative-teal scale-110' : 'bg-deep-indigo/10'}`} 
                    />
                  ))}
                </div>
              </div>
            ) : markdown ? (
              /* Rich Editor and Preview Split Workspace */
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-deep-indigo/5 flex-1 flex flex-col overflow-hidden">
                {/* Publish & Publish Options Toolbar */}
                <div className="bg-cloud-dancer/30 px-6 py-4 border-b border-deep-indigo/5 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest">
                    ✏️ Sandbox Article Draft
                  </span>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="bg-transformative-teal text-cloud-dancer px-6 py-2.5 rounded-full text-xs font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {publishing ? 'Publishing to Sanity...' : 'Publish Directly to Sanity'}
                    </button>
                  </div>
                </div>

                {/* Rich Metadata Panel - Reveals on generated post */}
                <div className="bg-cloud-dancer/20 p-5 border-b border-deep-indigo/10 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/50 mb-1.5">Article Author</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-transformative-teal text-deep-indigo"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/50 mb-1.5">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-transformative-teal text-deep-indigo"
                      placeholder="Lovina, Snorkeling, Bali"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/50 mb-1.5">SEO Excerpt (Meta Description)</label>
                    <textarea
                      rows={2}
                      className="w-full bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-light focus:ring-1 focus:ring-transformative-teal resize-none text-deep-indigo leading-normal"
                      placeholder="Brief 2-sentence search snippet preview..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/50 mb-1.5">Sidebar Takeaways (One per line)</label>
                    <textarea
                      rows={2}
                      className="w-full bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-light focus:ring-1 focus:ring-transformative-teal resize-none font-mono text-deep-indigo leading-normal"
                      placeholder="Takeaway 1&#10;Takeaway 2"
                      value={takeawaysInput}
                      onChange={(e) => setTakeawaysInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/50 mb-1.5">Structured FAQs (Q: \n A:)</label>
                    <textarea
                      rows={2}
                      className="w-full bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-light focus:ring-1 focus:ring-transformative-teal resize-none font-mono text-deep-indigo leading-normal"
                      placeholder="Q: Is it safe?&#10;A: Yes, very safe."
                      value={faqsInput}
                      onChange={(e) => setFaqsInput(e.target.value)}
                    />
                  </div>
                </div>

                {publishSuccess && (
                  <div className="bg-transformative-teal/15 text-transformative-teal px-6 py-3.5 text-xs border-b border-transformative-teal/10 flex items-center justify-between">
                    <span>
                      🎉 <strong>Successfully Published!</strong> Your post is live in Sanity dataset (ID: {publishedDocId}).
                    </span>
                    <Link href="/admin" target="_blank" className="font-bold underline decoration-2 hover:text-deep-indigo transition-colors">
                      View in Sanity Studio →
                    </Link>
                  </div>
                )}

                {publishError && (
                  <div className="bg-coral-pop/10 text-coral-pop px-6 py-3.5 text-xs border-b border-coral-pop/10">
                    ❌ <strong>Publishing failed:</strong> {publishError}
                  </div>
                )}

                {/* Editor Split Layout */}
                <div className="flex-1 grid md:grid-cols-2 divide-x divide-deep-indigo/10 overflow-hidden">
                  {/* Left Column: Editable Raw Textarea */}
                  <div className="flex flex-col h-full overflow-hidden">
                    <textarea
                      className="w-full flex-1 p-6 text-xs font-mono text-deep-indigo/90 bg-white border-none focus:ring-0 resize-none overflow-y-auto leading-relaxed outline-none"
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                    />
                  </div>

                  {/* Right Column: Visual Styled Render Preview */}
                  <div className="p-6 h-full overflow-y-auto bg-cloud-dancer/10 prose prose-slate max-w-none scroll-smooth">
                    {renderPreview()}
                  </div>
                </div>
              </div>
            ) : (
              /* Idle Workspace Empty state */
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-deep-indigo/5 flex-1 flex flex-col items-center justify-center text-center text-deep-indigo/40 space-y-4">
                <span className="text-4xl select-none">✍️</span>
                <div>
                  <h3 className="text-lg font-serif font-bold text-deep-indigo">Workspace Ready</h3>
                  <p className="text-xs text-deep-indigo/50 max-w-xs mt-1">Configure your API credentials, click a Finns-style preset topic, and generate an authority post.</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Database,
  Layers,
  MessageSquare,
  BookmarkCheck,
  Send,
  HelpCircle,
  BrainCircuit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface KnowledgeItem {
  id: string;
  type: 'book' | 'blog' | 'text' | 'qa_pair';
  title: string;
  author?: string;
  category: string;
  fileName?: string;
  fileType?: string;
  totalPages?: number;
  totalChunks: number;
  isScanned?: boolean;
  question?: string;
  summarySnippet?: string;
  uploadedAt: string;
}

interface StatsData {
  totalChunks: number;
  totalRecords: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

export default function AdminKnowledgeStudioPage() {
  const [activeTab, setActiveTab] = useState<'book' | 'blog' | 'text' | 'qa' | 'search'>('book');
  const [records, setRecords] = useState<KnowledgeItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [adminToken, setAdminToken] = useState('jyotix-admin-secret');
  const [filterType, setFilterType] = useState<string>('all');

  // Book upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState('general_vedic');

  // Blog / Article state
  const [blogTitle, setBlogTitle] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('');
  const [blogCategory, setBlogCategory] = useState('general_vedic');
  const [blogContent, setBlogContent] = useState('');
  const [blogSourceUrl, setBlogSourceUrl] = useState('');

  // Raw Text / Sutra state
  const [textTitle, setTextTitle] = useState('');
  const [textAuthor, setTextAuthor] = useState('');
  const [textCategory, setTextCategory] = useState('general_vedic');
  const [textContent, setTextContent] = useState('');

  // Q&A Training Pair state
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaCategory, setQaCategory] = useState('general_vedic');

  // Status & notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search sandbox state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved token from localStorage on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jyotix_admin_key');
      if (saved) {
        setAdminToken(saved);
      } else {
        localStorage.setItem('jyotix_admin_key', 'jyotix-admin-secret');
      }
    }
  }, []);

  // Fetch registered knowledge records & stats
  const fetchKnowledge = async () => {
    setIsLoadingList(true);
    try {
      const token =
        adminToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('jyotix_admin_key') : null) ||
        'jyotix-admin-secret';
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'x-admin-key': token,
      };

      const res = await fetch('/api/admin/books', { headers });
      const data = await res.json();
      if (res.ok && data.records) {
        setRecords(data.records);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load knowledge:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [adminToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!bookTitle) {
        const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ');
        setBookTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  // 1. Submit Book Upload
  const handleUploadBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF, Markdown, or TXT file to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionStatus('Extracting pages and detecting OCR layout...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', bookTitle || selectedFile.name);
      formData.append('author', bookAuthor || 'Traditional Astrologer');
      formData.append('category', bookCategory);

      const token = adminToken || 'jyotix-admin-secret';
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'x-admin-key': token,
      };

      setActionStatus('Generating 768-dim Gemini embeddings and storing in Vector DB...');

      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ingest book');

      setSuccessMessage(
        `Book "${data.title}" successfully indexed! (${data.totalChunks} chunks generated)`
      );
      setSelectedFile(null);
      setBookTitle('');
      setBookAuthor('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchKnowledge();
    } catch (err: any) {
      setErrorMessage(err.message || 'Book upload failed');
    } finally {
      setIsSubmitting(false);
      setActionStatus(null);
    }
  };

  // 2. Submit Blog / Article
  const handleUploadBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      setErrorMessage('Please provide both Article Title and Content.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionStatus('Chunking article and generating Gemini embeddings...');

    try {
      const token = adminToken || 'jyotix-admin-secret';
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({
          type: 'blog',
          title: blogTitle,
          author: blogAuthor || 'Astrology Author',
          category: blogCategory,
          content: blogContent,
          sourceUrl: blogSourceUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ingest blog');

      setSuccessMessage(`Blog "${blogTitle}" successfully indexed into Vector DB!`);
      setBlogTitle('');
      setBlogAuthor('');
      setBlogContent('');
      setBlogSourceUrl('');
      fetchKnowledge();
    } catch (err: any) {
      setErrorMessage(err.message || 'Blog ingestion failed');
    } finally {
      setIsSubmitting(false);
      setActionStatus(null);
    }
  };

  // 3. Submit Raw Sutra / Rule Text
  const handleUploadText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle.trim() || !textContent.trim()) {
      setErrorMessage('Please provide both Sutra Title and Rule text.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionStatus('Indexing astrological sutras with semantic vectors...');

    try {
      const token = adminToken || 'jyotix-admin-secret';
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({
          type: 'text',
          title: textTitle,
          author: textAuthor || 'Classical Sage',
          category: textCategory,
          content: textContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ingest text');

      setSuccessMessage(`Sutra / Rule "${textTitle}" indexed into Vector DB!`);
      setTextTitle('');
      setTextAuthor('');
      setTextContent('');
      fetchKnowledge();
    } catch (err: any) {
      setErrorMessage(err.message || 'Text ingestion failed');
    } finally {
      setIsSubmitting(false);
      setActionStatus(null);
    }
  };

  // 4. Submit Q&A Training Pair
  const handleUploadQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) {
      setErrorMessage('Please provide both Question and Authoritative Answer.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionStatus('Training model grounding vector on Question & Answer pair...');

    try {
      const token = adminToken || 'jyotix-admin-secret';
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({
          type: 'qa_pair',
          question: qaQuestion,
          answer: qaAnswer,
          category: qaCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to train Q&A pair');

      setSuccessMessage('Q&A Training Pair indexed! Gemini will prioritize this response.');
      setQaQuestion('');
      setQaAnswer('');
      fetchKnowledge();
    } catch (err: any) {
      setErrorMessage(err.message || 'Q&A training failed');
    } finally {
      setIsSubmitting(false);
      setActionStatus(null);
    }
  };

  // 5. Seed Classical Baseline Knowledge
  const handleSeedBaseline = async () => {
    if (
      !confirm(
        'Seed baseline Vedic astrology knowledge from internal classical texts into the Vector DB?'
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setActionStatus('Seeding 10 Vedic astrology chapters into Vector DB...');
    setErrorMessage(null);

    try {
      const token = adminToken || 'jyotix-admin-secret';
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({ action: 'seed' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seeding failed');

      setSuccessMessage('Classical Vedic baseline indexed successfully!');
      fetchKnowledge();
    } catch (err: any) {
      setErrorMessage(err.message || 'Seeding failed');
    } finally {
      setIsSubmitting(false);
      setActionStatus(null);
    }
  };

  // Delete Item
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge record and its vectors?')) {
      return;
    }

    try {
      const token = adminToken || 'jyotix-admin-secret';
      const res = await fetch(`/api/admin/books?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
      });

      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        fetchKnowledge();
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Test Retrieval Sandbox
  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);

    try {
      const token = adminToken || 'jyotix-admin-secret';
      const res = await fetch(`/api/admin/books?search=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
      });

      const data = await res.json();
      if (data.result?.citations) {
        setSearchResults(data.result.citations);
      } else if (Array.isArray(data.citations)) {
        setSearchResults(data.citations);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error('Test search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  return (
    <div className="min-h-screen bg-[#080b12] text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1c2233]">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/chat"
                className="text-gray-400 hover:text-white transition flex items-center gap-1 text-xs sm:text-sm mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Chat</span>
              </Link>
              <span className="text-gray-600">/</span>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#ffd56b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-[#ffd56b]" />
                AI Astrologer Knowledge & Training Studio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Train & ground Gemini on your custom astrology books, blogs, sutras, and Q&A training
              pairs.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-[#121624] border border-[#262f44] rounded-lg px-2.5 py-1">
              <span className="text-[10px] text-gray-400 font-mono">KEY:</span>
              <input
                type="text"
                placeholder="Admin Secret Key"
                value={adminToken}
                onChange={(e) => {
                  setAdminToken(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('jyotix_admin_key', e.target.value);
                  }
                }}
                className="bg-transparent text-xs text-[#ffd56b] focus:outline-none w-36 sm:w-44 font-mono"
              />
            </div>
            <Button
              onClick={fetchKnowledge}
              variant="outline"
              size="sm"
              title="Refresh Knowledge Index"
              className="bg-[#121624] border-[#262f44] hover:bg-[#1a2133] text-gray-300 text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* System Architecture Highlights (No MongoDB - 100% Vector DB) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0f131f] border border-[#1f2638] flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#ffd56b]/10 text-[#ffd56b] shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Vector DB
              </div>
              <div className="font-bold text-gray-100 text-sm">
                {stats?.totalChunks ?? 0} Chunks
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0f131f] border border-[#1f2638] flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Books & Docs
              </div>
              <div className="font-bold text-gray-100 text-sm">
                {stats?.byType?.book ?? records.filter((r) => r.type === 'book').length}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0f131f] border border-[#1f2638] flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Blogs & Sutras
              </div>
              <div className="font-bold text-gray-100 text-sm">
                {(stats?.byType?.blog ?? 0) + (stats?.byType?.text ?? 0)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0f131f] border border-[#1f2638] flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Q&A Pairs
              </div>
              <div className="font-bold text-gray-100 text-sm">
                {stats?.byType?.qa_pair ?? records.filter((r) => r.type === 'qa_pair').length}
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {actionStatus && (
          <div className="p-3 bg-[#131929] border border-[#2b354d] rounded-xl flex items-center gap-2 text-[#ffd56b] text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>{actionStatus}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl flex items-center gap-2 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Grid: Training Input Form (Tabs) & Knowledge Library */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Multi-Format Training Tabs */}
          <div className="lg:col-span-5 bg-[#0f131f] border border-[#1e2538] rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 p-1 bg-[#090c14] border border-[#1a2133] rounded-xl overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'book'
                    ? 'bg-[#ffd56b] text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Book (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('blog')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'blog'
                    ? 'bg-[#ffd56b] text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Blog / Article</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'text'
                    ? 'bg-[#ffd56b] text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Sutras</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'qa'
                    ? 'bg-[#ffd56b] text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Q&A Pair</span>
              </button>
            </div>

            {/* TAB 1: Upload Astrology Book (PDF, TXT, MD) */}
            {activeTab === 'book' && (
              <form onSubmit={handleUploadBook} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Book Document File (PDF, TXT, MD)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#242c40] hover:border-[#ffd56b]/60 rounded-xl p-4 text-center cursor-pointer transition bg-[#090d16]"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md,.markdown"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-[#ffd56b]">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                        <span className="text-gray-400 text-[10px]">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1 text-gray-400">
                        <Upload className="w-5 h-5 mx-auto text-gray-500 mb-1" />
                        <p className="text-gray-300 font-medium">Click to select PDF or drag & drop</p>
                        <p className="text-[11px] text-gray-500">
                          Supports digital & scanned PDFs up to 50MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Book Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Brihat Parashara Hora Shastra"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs h-9"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Author / Sage</label>
                    <Input
                      type="text"
                      placeholder="e.g. Sage Parashara"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      className="bg-[#141926] border-[#252e42] text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Primary Category</label>
                    <select
                      value={bookCategory}
                      onChange={(e) => setBookCategory(e.target.value)}
                      className="w-full bg-[#141926] border border-[#252e42] rounded-md px-2.5 h-9 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ffd56b]"
                    >
                      <option value="general_vedic">General Vedic</option>
                      <option value="rashis">12 Rashis (Zodiac)</option>
                      <option value="bhavas">12 Bhavas (Houses)</option>
                      <option value="grahas">9 Grahas (Planets)</option>
                      <option value="nakshatras">27 Nakshatras</option>
                      <option value="dasha_timing">Dasha & Timing</option>
                      <option value="yogas_doshas">Yogas & Doshas</option>
                      <option value="marriage_compatibility">Marriage & Match</option>
                      <option value="career_finance">Career & Wealth</option>
                      <option value="remedies_safety">Remedies & Puja</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="w-full bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-semibold h-9.5 hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Ingesting Book...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Index Book into Vector DB
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* TAB 2: Ingest Blog / Article */}
            {activeTab === 'blog' && (
              <form onSubmit={handleUploadBlog} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Article Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Secret Yogas for Raj Yoga in 2026"
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs h-9"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Author</label>
                    <Input
                      type="text"
                      placeholder="e.g. Jyotix Expert"
                      value={blogAuthor}
                      onChange={(e) => setBlogAuthor(e.target.value)}
                      className="bg-[#141926] border-[#252e42] text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Category</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full bg-[#141926] border border-[#252e42] rounded-md px-2 h-9 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ffd56b]"
                    >
                      <option value="general_vedic">General Vedic</option>
                      <option value="career_finance">Career & Wealth</option>
                      <option value="marriage_compatibility">Marriage</option>
                      <option value="yogas_doshas">Yogas & Doshas</option>
                      <option value="dasha_timing">Dasha Timing</option>
                      <option value="remedies_safety">Remedies</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Blog / Article Content (Markdown or Plain Text)
                  </label>
                  <Textarea
                    placeholder="Paste full article text or blog post here..."
                    rows={6}
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !blogTitle.trim() || !blogContent.trim()}
                  className="w-full bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-semibold h-9.5 hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Indexing Article...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Add Article to Vector Knowledge
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* TAB 3: Astrological Sutra / Raw Rules */}
            {activeTab === 'text' && (
              <form onSubmit={handleUploadText} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Sutra / Rule Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Jupiter Aspect on 7th House from Moon"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs h-9"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Source / Shastra</label>
                    <Input
                      type="text"
                      placeholder="e.g. Jataka Parijata"
                      value={textAuthor}
                      onChange={(e) => setTextAuthor(e.target.value)}
                      className="bg-[#141926] border-[#252e42] text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Category</label>
                    <select
                      value={textCategory}
                      onChange={(e) => setTextCategory(e.target.value)}
                      className="w-full bg-[#141926] border border-[#252e42] rounded-md px-2 h-9 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ffd56b]"
                    >
                      <option value="general_vedic">General Vedic</option>
                      <option value="grahas">9 Grahas</option>
                      <option value="bhavas">12 Houses</option>
                      <option value="yogas_doshas">Yogas & Doshas</option>
                      <option value="marriage_compatibility">Marriage</option>
                      <option value="career_finance">Career</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Sutra / Shloka / Planetary Rule
                  </label>
                  <Textarea
                    placeholder="Enter the exact astrological rule or shloka explanation..."
                    rows={6}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !textTitle.trim() || !textContent.trim()}
                  className="w-full bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-semibold h-9.5 hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Indexing Sutra...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Index Astrological Rule
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* TAB 4: Q&A Training Pair (Instruction Grounding) */}
            {activeTab === 'qa' && (
              <form onSubmit={handleUploadQA} className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#ffd56b]/10 border border-[#ffd56b]/20 text-[#ffd56b] text-[11px] flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Teach Gemini how to answer specific user questions. When users ask similar
                    questions, Gemini retrieves this exact authoritative answer with highest
                    priority.
                  </span>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Target Question / User Query
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Shaadi kab hogi aur life partner kaisa hoga?"
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Category</label>
                  <select
                    value={qaCategory}
                    onChange={(e) => setQaCategory(e.target.value)}
                    className="w-full bg-[#141926] border border-[#252e42] rounded-md px-2 h-9 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ffd56b]"
                  >
                    <option value="marriage_compatibility">Marriage & Compatibility</option>
                    <option value="career_finance">Career & Job</option>
                    <option value="remedies_safety">Remedies & Solutions</option>
                    <option value="dasha_timing">Dasha & Timing</option>
                    <option value="yogas_doshas">Yogas & Doshas</option>
                    <option value="general_vedic">General Vedic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Authoritative Astrological Answer / Grounding Rule
                  </label>
                  <Textarea
                    placeholder="Specify the exact reasoning, houses (7th/2nd/11th), planetary combinations, and guidance Gemini must use..."
                    rows={6}
                    value={qaAnswer}
                    onChange={(e) => setQaAnswer(e.target.value)}
                    className="bg-[#141926] border-[#252e42] text-xs resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !qaQuestion.trim() || !qaAnswer.trim()}
                  className="w-full bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-semibold h-9.5 hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Training Q&A Grounding...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Save Q&A Training Grounding
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* Quick Baseline Seeding Button */}
            <div className="pt-2 border-t border-[#1a2133] flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Classical Vedic Baseline (10 Shastras):</span>
              <Button
                type="button"
                onClick={handleSeedBaseline}
                disabled={isSubmitting}
                variant="outline"
                size="sm"
                className="bg-[#141926] border-[#262f44] hover:bg-[#1f273b] text-gray-300 text-[11px] h-7"
              >
                Seed Baseline
              </Button>
            </div>
          </div>

          {/* Right Column: Knowledge Base Library & Live Retrieval Sandbox */}
          <div className="lg:col-span-7 space-y-5">
            {/* Registered Knowledge List */}
            <div className="bg-[#0f131f] border border-[#1e2538] rounded-2xl p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c2233] mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#ffd56b]" />
                  <h2 className="font-semibold text-gray-100 text-sm">Indexed Knowledge Base</h2>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1 text-[11px]">
                  {['all', 'book', 'blog', 'text', 'qa_pair'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2 py-0.5 rounded-md uppercase font-medium transition ${
                        filterType === type
                          ? 'bg-[#ffd56b]/20 text-[#ffd56b] border border-[#ffd56b]/30'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {type === 'qa_pair' ? 'Q&A' : type}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingList ? (
                <div className="py-10 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading Vector DB records...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-xs space-y-1.5">
                  <BookOpen className="w-7 h-7 mx-auto text-gray-600" />
                  <p>No knowledge records found in this category.</p>
                  <p className="text-[11px] text-gray-600">
                    Use the tabs on the left or click &quot;Seed Baseline&quot; to initialize.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredRecords.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#131826] border border-[#222a3d] hover:border-[#323d57] rounded-xl flex items-start justify-between gap-3 transition text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-200 text-xs truncate max-w-[280px]">
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              item.type === 'book'
                                ? 'bg-[#ffd56b]/20 text-[#ffd56b]'
                                : item.type === 'blog'
                                ? 'bg-sky-500/20 text-sky-300'
                                : item.type === 'text'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {item.type === 'qa_pair' ? 'Q&A GROUNDING' : item.type}
                          </span>
                          <span className="text-[10px] text-gray-500">• {item.category}</span>
                        </div>

                        {item.summarySnippet && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 italic">
                            &quot;{item.summarySnippet}&quot;
                          </p>
                        )}

                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                          <span>{item.totalChunks} chunks</span>
                          {item.totalPages ? <span>• {item.totalPages} pages</span> : null}
                          {item.author ? <span>• {item.author}</span> : null}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 w-7 p-0 shrink-0"
                        title="Delete record and vector embeddings"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Semantic Retrieval Sandbox */}
            <div className="bg-[#0f131f] border border-[#1e2538] rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1c2233]">
                <Search className="w-4 h-4 text-[#ffd56b]" />
                <h3 className="font-semibold text-gray-100 text-xs sm:text-sm">
                  Test Semantic Retrieval Against Vector DB
                </h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Type any user question to see which chunks are retrieved from your custom books,
                blogs, and Q&A training pairs with cosine similarity scores.
              </p>

              <form onSubmit={handleTestSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. 7th house lord in 12th house effects or marriage timing"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141926] border-[#252e42] text-xs h-9 flex-1"
                />
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-[#1e2538] text-gray-200 border border-[#2f3952] hover:bg-[#2b354d] text-xs h-9 px-4 cursor-pointer"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </Button>
              </form>

              {searchResults && (
                <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
                  <div className="text-[11px] font-semibold text-gray-300">
                    Retrieved Knowledge Chunks ({searchResults.length}):
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">
                      No matching chunks found above score threshold.
                    </div>
                  ) : (
                    searchResults.map((res, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-[#131826] border border-[#222a3d] rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-medium text-[#ffd56b] text-[11px]">
                          <span className="truncate max-w-[320px]">
                            {res.knowledgeType === 'qa_pair'
                              ? '🎯 Q&A Grounding: '
                              : res.isCustomBook
                              ? '📖 Custom Book: '
                              : '📜 Classical Shastra: '}
                            {res.source || res.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#20273a] text-gray-300 rounded shrink-0">
                            Score: {(res.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-300 italic pt-0.5">
                          &quot;{res.snippet}&quot;
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

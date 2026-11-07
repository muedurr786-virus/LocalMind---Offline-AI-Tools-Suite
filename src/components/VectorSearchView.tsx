import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, BookOpen, HelpCircle, FileText, Check } from 'lucide-react';
import { VectorSearchEngine, INITIAL_KNOWLEDGE_BASE } from '../engines/vectorSearch';
import { VectorDocument } from '../types';

export const VectorSearchView: React.FC = () => {
  const [engine] = useState(() => new VectorSearchEngine(INITIAL_KNOWLEDGE_BASE));
  const [documents, setDocuments] = useState<VectorDocument[]>(() => engine.getDocuments());
  const [query, setQuery] = useState<string>('Why is offline edge computing more secure?');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Personal Notes');
  const [newContent, setNewContent] = useState<string>('');

  const searchResults = useMemo(() => {
    return engine.search(query, 4);
  }, [engine, query, documents]);

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newDoc: VectorDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory.trim() || 'General',
      content: newContent.trim(),
    };

    engine.addDocument(newDoc);
    setDocuments([...engine.getDocuments()]);
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    engine.deleteDocument(id);
    setDocuments([...engine.getDocuments()]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Semantic Vector Search & Local Q&A</h1>
          <p className="text-xs text-neutral-400 mt-1">
            BM25 term weighting, sub-word character 3-grams, and cosine similarity ranking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Add Custom Document</span>
        </button>
      </div>

      {/* Search Input Bar & Quick Suggestions */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge base with natural semantic query..."
            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500">Quick tests:</span>
          {[
            'Why is offline edge computing more secure?',
            'How does neural backpropagation work?',
            'What algorithms perform extractive summarization?',
            'How does computer vision detect text on canvas?',
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => setQuery(sample)}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-800/80 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Search Results + Knowledge Base Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Semantic Search Results */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">
              Ranked Retrieval Results ({searchResults.length})
            </span>
            <span className="font-mono text-neutral-500">Vector Cosine Metric</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-8 text-center text-xs text-neutral-500">
              No documents matched the semantic vector threshold. Try broader keywords.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map(({ doc, score, relevantSnippets }, idx) => (
                <div
                  key={doc.id}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3 transition-colors hover:border-neutral-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                        {doc.category}
                      </span>
                      <h2 className="text-sm font-semibold text-white">{doc.title}</h2>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono tabular-nums text-emerald-400 block">
                        {(score * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-neutral-500">Similarity</span>
                    </div>
                  </div>

                  {/* Relevant Snippet Extract */}
                  {relevantSnippets.length > 0 && (
                    <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-1">
                      <span className="text-[10px] text-neutral-500 font-mono block">
                        Extracted Key Context:
                      </span>
                      <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                        "{relevantSnippets[0]}"
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                    {doc.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Knowledge Base Inventory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">
              Indexed Documents ({documents.length})
            </span>
            <span className="font-mono text-neutral-500">Local Vector Space</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200 truncate pr-2">{doc.title}</span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                    title="Remove Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                  <span>{doc.category}</span>
                  <span>·</span>
                  <span>{doc.content.split(/\s+/).length} words</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Add Document to Local Index</h2>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Privacy Protocols in Medical Software"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Category / Domain</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Security, Medical, Personal"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Content Passages</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste documentation, notes, or article content to be indexed into local vector space..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-cyan-500 font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-semibold rounded-lg transition-colors"
                >
                  Index Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

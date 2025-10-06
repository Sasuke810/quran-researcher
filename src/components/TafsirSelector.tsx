"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, BookOpen, User, Globe } from "lucide-react";

export interface TafsirEdition {
  id: number;
  name_ar: string;
  name_en?: string;
  author_ar?: string;
  author_en?: string;
  description?: string;
  language: string;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

type TafsirSelectorProps = {
  selectedTafsir: number | null;
  onTafsirChange: (tafsirId: number | null) => void;
  compact?: boolean;
};

export function TafsirSelector({ selectedTafsir, onTafsirChange, compact = false }: TafsirSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tafsirEditions, setTafsirEditions] = useState<TafsirEdition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tafsir editions from API
  useEffect(() => {
    const fetchTafsirEditions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch only active tafsir editions
        const response = await fetch('/api/tafsir-editions?active=true&limit=100');
        const result: ApiResponse<TafsirEdition[]> = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch tafsir editions');
        }
        
        setTafsirEditions(result.data || []);
        
        // Set first edition as default if none selected and editions are available
        if (!selectedTafsir && result.data && result.data.length > 0) {
          onTafsirChange(result.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch tafsir editions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tafsir editions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTafsirEditions();
  }, [selectedTafsir, onTafsirChange]);

  const currentTafsir = tafsirEditions.find((t) => t.id === selectedTafsir);

  const handleSelect = (tafsirId: number) => {
    onTafsirChange(tafsirId);
    setIsOpen(false);
  };

  const getDisplayName = (edition: TafsirEdition) => {
    return edition.name_ar || edition.name_en || `تفسير ${edition.id}`;
  };

  const getAuthorName = (edition: TafsirEdition) => {
    return edition.author_ar || edition.author_en;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))]">
        <BookOpen className="h-3 w-3 animate-pulse" />
        <span>جاري تحميل التفاسير...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500">
        <BookOpen className="h-3 w-3" />
        <span>خطأ في تحميل التفاسير</span>
      </div>
    );
  }

  if (tafsirEditions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))]">
        <BookOpen className="h-3 w-3" />
        <span>لا توجد تفاسير متاحة</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs bg-[rgb(var(--color-surface-raised))] dark:bg-[rgb(var(--color-dark-surface-raised))] hover:bg-[rgb(var(--color-surface-elevated))] dark:hover:bg-[rgb(var(--color-dark-surface-elevated))] text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))] shadow-depth-sm hover:shadow-depth-md transition-all"
        >
          <BookOpen className="h-3 w-3" />
          <span className="font-medium">
            {currentTafsir ? getDisplayName(currentTafsir) : "اختر التفسير"}
          </span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 bottom-full z-50 mb-2 w-80 rounded-xl bg-[rgb(var(--color-surface-base))] dark:bg-[rgb(var(--color-dark-surface-base))] shadow-depth-xl border border-[rgb(var(--color-border-subtle))] dark:border-[rgb(var(--color-dark-border-subtle))] overflow-hidden">
              <div className="max-h-96 overflow-y-auto p-2">
                <div className="px-3 py-2 border-b border-[rgb(var(--color-border-subtle))] dark:border-[rgb(var(--color-dark-border-subtle))]">
                  <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                    اختر التفسير
                  </h3>
                </div>
                {tafsirEditions.map((edition) => (
                  <button
                    key={edition.id}
                    type="button"
                    onClick={() => handleSelect(edition.id)}
                    className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-right transition-all ${
                      edition.id === selectedTafsir
                        ? "bg-[rgb(var(--color-accent-300))]/10 dark:bg-[rgb(var(--color-dark-accent-200))]/10 ring-1 ring-[rgb(var(--color-accent-300))]/30"
                        : "hover:bg-[rgb(var(--color-surface-raised))] dark:hover:bg-[rgb(var(--color-dark-surface-raised))]"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      edition.id === selectedTafsir
                        ? "bg-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))] text-white"
                        : "bg-[rgb(var(--color-surface-elevated))] dark:bg-[rgb(var(--color-dark-surface-elevated))] text-[rgb(var(--color-text-tertiary))]"
                    }`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                          {getDisplayName(edition)}
                        </span>
                        {edition.language !== 'ar' && (
                          <Globe className="h-3 w-3 text-[rgb(var(--color-text-quaternary))]" />
                        )}
                      </div>
                      {getAuthorName(edition) && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3 text-[rgb(var(--color-text-quaternary))]" />
                          <p className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))] dark:text-[rgb(var(--color-dark-text-quaternary))]">
                            {getAuthorName(edition)}
                          </p>
                        </div>
                      )}
                      {edition.description && (
                        <p className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))] dark:text-[rgb(var(--color-dark-text-quaternary))] mt-1 line-clamp-2">
                          {edition.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))] mb-2">
        اختر التفسير
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[rgb(var(--color-surface-raised))] dark:bg-[rgb(var(--color-dark-surface-raised))] hover:bg-[rgb(var(--color-surface-elevated))] dark:hover:bg-[rgb(var(--color-dark-surface-elevated))] shadow-depth-sm hover:shadow-depth-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))] text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                {currentTafsir ? getDisplayName(currentTafsir) : "اختر التفسير"}
              </div>
              {currentTafsir && getAuthorName(currentTafsir) && (
                <div className="text-[0.7rem] text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))]">
                  {getAuthorName(currentTafsir)}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-[rgb(var(--color-text-tertiary))] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 bottom-full z-50 mb-2 w-full rounded-xl bg-[rgb(var(--color-surface-base))] dark:bg-[rgb(var(--color-dark-surface-base))] shadow-depth-xl border border-[rgb(var(--color-border-subtle))] dark:border-[rgb(var(--color-dark-border-subtle))] overflow-hidden">
              <div className="max-h-96 overflow-y-auto p-2">
                {tafsirEditions.map((edition) => (
                  <button
                    key={edition.id}
                    type="button"
                    onClick={() => handleSelect(edition.id)}
                    className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-right transition-all ${
                      edition.id === selectedTafsir
                        ? "bg-[rgb(var(--color-accent-300))]/10 dark:bg-[rgb(var(--color-dark-accent-200))]/10 ring-1 ring-[rgb(var(--color-accent-300))]/30"
                        : "hover:bg-[rgb(var(--color-surface-raised))] dark:hover:bg-[rgb(var(--color-dark-surface-raised))]"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      edition.id === selectedTafsir
                        ? "bg-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))] text-white"
                        : "bg-[rgb(var(--color-surface-elevated))] dark:bg-[rgb(var(--color-dark-surface-elevated))] text-[rgb(var(--color-text-tertiary))]"
                    }`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                          {getDisplayName(edition)}
                        </span>
                        {edition.language !== 'ar' && (
                          <Globe className="h-3 w-3 text-[rgb(var(--color-text-quaternary))]" />
                        )}
                      </div>
                      {getAuthorName(edition) && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3 text-[rgb(var(--color-text-quaternary))]" />
                          <p className="text-[0.7rem] text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))] mt-0.5">
                            {getAuthorName(edition)}
                          </p>
                        </div>
                      )}
                      {edition.description && (
                        <p className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))] dark:text-[rgb(var(--color-dark-text-quaternary))] mt-1 line-clamp-2">
                          {edition.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

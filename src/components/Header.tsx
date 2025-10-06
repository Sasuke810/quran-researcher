"use client";

import React from "react";
import { Menu, Sun, Moon, BookOpen } from "lucide-react";

type ThemeMode = "light" | "dark";

type HeaderProps = {
  theme: ThemeMode;
  onThemeToggle: () => void;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
};

export function Header({ theme, onThemeToggle, onMenuToggle, showMenuButton = false }: HeaderProps) {
  return (
    <header className="flex flex-col gap-2 text-center sm:text-right">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--color-surface-base))] dark:bg-[rgb(var(--color-dark-surface-base))] px-4 py-2.5 shadow-depth-md">
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgb(var(--color-interactive-base))] dark:bg-[rgb(var(--color-dark-interactive-base))] hover:bg-[rgb(var(--color-interactive-hover))] dark:hover:bg-[rgb(var(--color-dark-interactive-hover))] active:bg-[rgb(var(--color-interactive-active))] dark:active:bg-[rgb(var(--color-dark-interactive-active))] shadow-depth-sm hover:shadow-depth-md transition-all lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="h-4 w-4 text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))]" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(var(--color-purple-400))] to-[rgb(var(--color-slate-400))] dark:from-[rgb(var(--color-dark-purple-200))] dark:to-[rgb(var(--color-dark-slate-200))] shadow-depth-sm">
              <BookOpen className="h-4 w-4 text-white drop-shadow-sm" />
            </div>
            <span className="text-sm font-bold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
              الباحث القرآني
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onThemeToggle}
          className="flex items-center gap-2 rounded-full bg-[rgb(var(--color-interactive-base))] dark:bg-[rgb(var(--color-dark-interactive-base))] hover:bg-[rgb(var(--color-interactive-hover))] dark:hover:bg-[rgb(var(--color-dark-interactive-hover))] active:bg-[rgb(var(--color-interactive-active))] dark:active:bg-[rgb(var(--color-dark-interactive-active))] shadow-depth-sm hover:shadow-depth-md px-3 py-1.5 text-xs font-semibold transition-all"
          aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-3.5 w-3.5 text-[rgb(var(--color-dark-accent-200))]" />
              <span className="text-[rgb(var(--color-dark-text-secondary))]">وضع فاتح</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-[rgb(var(--color-purple-400))]" />
              <span className="text-[rgb(var(--color-text-secondary))]">وضع داكن</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

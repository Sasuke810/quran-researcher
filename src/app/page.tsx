"use client";

import { useEffect, useMemo, useState } from "react";
import { Noto_Kufi_Arabic } from "next/font/google";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { useConversation } from "@/contexts/ConversationContext";

type ThemeMode = "light" | "dark";

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { activeConversationId } = useConversation();

  const containerClasses = useMemo(
    () => "",
    [theme]
  );

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem("theme-mode");
    // Always default to dark mode
    const selectedTheme = (storedTheme === "light" || storedTheme === "dark") ? storedTheme : "dark";
    setTheme(selectedTheme);
    window.localStorage.setItem("theme-mode", selectedTheme);
    
    // Ensure dark class is applied immediately
    if (selectedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("data-theme", theme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme-mode", theme);
    }
  }, [theme]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div
      dir="rtl"
      className={`${notoKufiArabic.className} ${containerClasses} relative h-screen w-full overflow-hidden bg-[rgb(var(--color-bg-base))] dark:bg-[rgb(var(--color-dark-bg-base))]`}
      style={{
        fontFamily: '"Noto Kufi Arabic", "Amiri", "Scheherazade New", "Arial", "Tahoma", sans-serif',
      }}
    >
      <main className="relative z-10 flex h-full w-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:p-8">
        <Header
          theme={theme}
          onThemeToggle={toggleTheme}
          onMenuToggle={toggleSidebar}
          showMenuButton={true}
        />

        <div className="grid h-full w-full flex-1 gap-6 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          <div className="relative flex h-full flex-col gap-4 overflow-hidden">
            <div className="flex-1 overflow-hidden rounded-3xl shadow-depth-lg">
              <ChatArea />
            </div>
            {activeConversationId && <MessageInput />}
          </div>
        </div>
      </main>
    </div>
  );
}
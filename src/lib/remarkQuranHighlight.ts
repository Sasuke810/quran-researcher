import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Parent } from "unist";

type Paragraph = Parent & {
  type: "paragraph";
  data?: {
    hProperties?: {
      className?: string | string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

type TextNode = {
  type: "text";
  value: string;
};

type ElementNode = {
  type: "element";
  tagName: string;
  properties?: {
    className?: string | string[];
    [key: string]: unknown;
  };
  children: Array<TextNode | ElementNode>;
};

const QURAN_VERSE_REGEX = /﴿([^﴿﴾]+)﴾/g;

function toClassArray(className?: string | string[]): string[] {
  if (!className) return [];
  if (Array.isArray(className)) return className;
  return className.split(" ").filter(Boolean);
}

export const remarkQuranHighlight: Plugin = () => (tree) => {
  visit(tree, "text", (node: TextNode, index: number | null, parent: Parent | null) => {
    if (!parent || typeof index !== "number") return;
    if (!node.value || !QuranVerseRegexTest(node.value)) return;

    const replacements: Array<TextNode | ElementNode> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    resetQuranVerseRegex();

    while ((match = QURAN_VERSE_REGEX.exec(node.value)) !== null) {
      if (match.index > lastIndex) {
        replacements.push({
          type: "text",
          value: node.value.slice(lastIndex, match.index),
        });
      }

      const verseContent = match[1].trim();

      replacements.push({
        type: "element",
        tagName: "span",
        properties: {
          className: ["quran-verse"],
        },
        children: [
          {
            type: "text",
            value: `﴿${verseContent}﴾`,
          },
        ],
      });

      lastIndex = QURAN_VERSE_REGEX.lastIndex;
    }

    if (lastIndex < node.value.length) {
      replacements.push({
        type: "text",
        value: node.value.slice(lastIndex),
      });
    }

    parent.children.splice(index, 1, ...replacements);
  });

  visit(tree, "paragraph", (node: Paragraph) => {
    const hasVerse = node.children.some((child) => {
      if (typeof child !== "object" || !("type" in child)) return false;
      if (child.type !== "element") return false;

      const className = (child as ElementNode).properties?.className;

      if (Array.isArray(className)) {
        return className.some((cls) => cls === "quran-verse");
      }

      if (typeof className === "string") {
        return className.split(" ").includes("quran-verse");
      }

      return false;
    });

    if (!hasVerse) return;

    node.data = node.data || {};
    node.data.hProperties = node.data.hProperties || {};
    const classList = new Set<string>(toClassArray(node.data.hProperties.className));

    classList.add("quran-verse-block");

    node.data.hProperties.className = Array.from(classList);
  });
};

function QuranVerseRegexTest(value: string): boolean {
  resetQuranVerseRegex();
  const result = QURAN_VERSE_REGEX.test(value);
  resetQuranVerseRegex();
  return result;
}

function resetQuranVerseRegex() {
  QURAN_VERSE_REGEX.lastIndex = 0;
}

export default remarkQuranHighlight;

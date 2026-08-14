import { Fragment, type ReactNode } from 'react';
import { BlockMath, InlineMath } from 'react-katex';

/** Split on $$block$$ then $inline$ (non-greedy). Capturing group keeps delimiters in the parts array. */
const MATH_CHUNK = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

/**
 * Renders plain guide copy with optional KaTeX islands:
 * - `$a_r = v^2/R$` → inline
 * - `$$E = K + U$$` → display
 */
export function MathText({ text }: { text: string }): ReactNode {
  if (!text.includes('$')) return text;

  const parts = text.split(MATH_CHUNK);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      return <BlockMath key={i} math={part.slice(2, -2).trim()} />;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 3) {
      return <InlineMath key={i} math={part.slice(1, -1).trim()} />;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

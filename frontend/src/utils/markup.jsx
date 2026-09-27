// Минимальный разбор markdown-подобной разметки: ## и ### заголовки, списки,
// блоки кода ```, **жирный**, *курсив*, `код`. Этого достаточно для статей вики.

function renderInline(text, keyPrefix) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function parseContent(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const headings = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      const id = `section-${headings.length + 1}`;
      const level = heading[1].length;
      headings.push({ id, level, text: heading[2] });
      blocks.push({ type: 'heading', level, id, text: heading[2] });
      i++;
      continue;
    }

    const listMatch = line.match(/^(\d+\.|-)\s+/);
    if (listMatch) {
      const ordered = listMatch[1] !== '-';
      const pattern = ordered ? /^\d+\.\s+/ : /^-\s+/;
      const items = [];
      while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern, ''));
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(```|#{2,3}\s|\d+\.\s|-\s)/.test(lines[i])) {
      para.push(lines[i++]);
    }
    blocks.push({ type: 'paragraph', text: para.join(' ') });
  }

  return { blocks, headings };
}

export function Markup({ blocks }) {
  return blocks.map((block, idx) => {
    const key = `b${idx}`;
    switch (block.type) {
      case 'heading': {
        const Tag = block.level === 2 ? 'h2' : 'h3';
        return (
          <Tag key={key} id={block.id}>
            {renderInline(block.text, key)}
          </Tag>
        );
      }
      case 'code':
        return (
          <pre key={key}>
            <code>{block.text}</code>
          </pre>
        );
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag key={key}>
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item, `${key}-${j}`)}</li>
            ))}
          </Tag>
        );
      }
      default:
        return <p key={key}>{renderInline(block.text, key)}</p>;
    }
  });
}

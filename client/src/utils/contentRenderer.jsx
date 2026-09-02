import React from 'react';

function looksLikeCode(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.toLowerCase();
  return normalized.endsWith(';') || normalized.includes(';') || normalized.includes('{') || normalized.includes('}')
    || normalized.includes('()') || (normalized.includes('(') && normalized.includes(')'))
    || normalized.includes('#include') || normalized.includes('==') || normalized.includes('!=')
    || (normalized.includes('<') && normalized.includes('>') && (normalized.includes('.h') || normalized.includes('stdio') || normalized.includes('iostream') || normalized.includes('unistd')));
}

function autoFormatCode(value) {
  const source = value.trim();
  const hasFewNewlines = (source.match(/\n/g) || []).length < 2;
  if (!hasFewNewlines || !/[;{}]|#include/.test(source)) return source;

  let formatted = source.replace(/(#include\s*<.*?>)/gi, '$1\n').replace(/(#include\s*".*?")/gi, '$1\n');
  formatted = formatted.replace(/\{/g, ' {\n').replace(/\}/g, '\n}\n');
  let result = '';
  let parentheses = 0;
  for (const character of formatted) {
    if (character === '(') parentheses += 1;
    if (character === ')') parentheses -= 1;
    result += character === ';' && parentheses === 0 ? ';\n' : character;
  }

  let indent = 0;
  return result.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
    const output = `${'    '.repeat(indent)}${trimmed}`;
    if (trimmed.includes('{') && !trimmed.includes('}')) indent += 1;
    return output;
  }).filter(Boolean).join('\n');
}

const keywordPattern = /^(int|double|float|char|void|class|struct|public|private|protected|static|final|return|if|else|for|while|do|switch|case|break|continue|new|import|include|def|elif|from|print|printf|cout|cin|endl)\b/;

function highlightCode(value) {
  const tokens = [];
  let remaining = value;
  while (remaining) {
    const comment = remaining.match(/^(\/\/.*|\/\*[\s\S]*?\*\/)/);
    const string = remaining.match(/^(&quot;.*?&quot;|&#039;.*?&#039;|'.*?'|".*?")/);
    const keyword = remaining.match(keywordPattern);
    const preprocessor = remaining.match(/^#\w+/);
    const number = remaining.match(/^\b\d+\b/);
    const match = comment || string || keyword || preprocessor || number;

    if (!match) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
      continue;
    }

    const token = match[0];
    const type = comment ? 'comment' : string ? 'string' : keyword || preprocessor ? 'keyword' : 'number';
    tokens.push(<span className={`code-token-${type}`} key={`${tokens.length}-${token}`}>{token}</span>);
    remaining = remaining.slice(token.length);
  }
  return tokens;
}

function escapeText(value) {
  return String(value);
}

function renderProse(value) {
  const parts = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = imagePattern.exec(value))) {
    if (match.index > lastIndex) parts.push(<React.Fragment key={`text-${lastIndex}`}>{escapeText(value.slice(lastIndex, match.index)).split('\n').map((line, index) => <React.Fragment key={index}>{index ? <br /> : null}{line}</React.Fragment>)}</React.Fragment>);
    const url = match[2].trim();
    if (/^(https?:\/\/|data:image\/)/i.test(url)) {
      parts.push(<span className="question-image-container" key={`image-${match.index}`}><img src={url} alt={match[1] || 'Question illustration'} loading="lazy" /></span>);
    }
    lastIndex = imagePattern.lastIndex;
  }
  if (lastIndex < value.length) parts.push(<React.Fragment key={`text-${lastIndex}`}>{escapeText(value.slice(lastIndex)).split('\n').map((line, index) => <React.Fragment key={index}>{index ? <br /> : null}{line}</React.Fragment>)}</React.Fragment>);
  return <div className="question-prose">{parts}</div>;
}

function parseItems(value, pattern) {
  const matches = [...value.matchAll(pattern)];
  if (matches.length < 2) return null;
  return matches.map((match, index) => ({ label: match[1].toLowerCase(), text: value.slice(match.index + match[0].length, matches[index + 1]?.index || value.length).trim() }));
}

function renderMatchColumns(value) {
  const bracketed = parseItems(value, /(?:^|\s|\()([a-dA-D1-4])\)\s*/gi);
  const roman = parseItems(value, /(?:^|\s|\()(i{1,3}|iv|v|ix|x)\)\s*/gi);
  if (!bracketed || !roman) return null;
  const firstMarker = value.search(/(?:^|\s|\()[a-dA-D1-4]\)\s*/i);
  const intro = value.slice(0, firstMarker).replace(/([\w-]+)\s*:\s*$/, '').trim();
  return <>
    {intro && renderProse(intro)}
    <div className="match-columns">
      <MatchColumn title="Column I" items={bracketed} accent="primary" />
      <MatchColumn title="Column II" items={roman} accent="accent" />
    </div>
  </>;
}

function MatchColumn({ title, items, accent }) {
  return <div className="match-column"><h4 className={accent}>{title}</h4>{items.map((item) => <div className="match-item" key={`${title}-${item.label}`}><span className={`match-label ${accent}`}>{item.label}</span><span>{item.text}</span></div>)}</div>;
}

function renderContentSegments(value) {
  const segments = [];
  const codePattern = /```[a-zA-Z0-9_+-]*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = codePattern.exec(value))) {
    if (match.index > lastIndex) segments.push(renderProse(value.slice(lastIndex, match.index)));
    const code = escapeText(match[1].replace(/\n$/, ''));
    segments.push(<div className="code-container" key={`code-${match.index}`}><pre className="code-block">{highlightCode(code)}</pre></div>);
    lastIndex = codePattern.lastIndex;
  }
  if (lastIndex < value.length) segments.push(renderProse(value.slice(lastIndex)));
  return segments;
}

function ContentRenderer({ text }) {
  if (!text) return null;
  if (text.includes('```') || /!\[[^\]]*\]\([^)]+\)/.test(text)) return <>{renderContentSegments(text)}</>;
  const matchColumns = renderMatchColumns(text);
  if (matchColumns) return matchColumns;
  const escaped = escapeText(text);
  const codeStart = [/#include\s*(<|&lt;)[\w.]+(>|&gt;)/i, /\b(void|int)\s+main\s*\([^)]*\)/i, /\bclass\s+\w+\s*(\{|\bextends\b|:)/i, /\bdef\s+\w+\s*\([^)]*\)\s*:/i].reduce((earliest, pattern) => {
    const match = escaped.match(pattern);
    return match && match.index !== undefined && (earliest === -1 || match.index < earliest) ? match.index : earliest;
  }, -1);
  if (codeStart !== -1) {
    const prose = escaped.slice(0, codeStart);
    const code = autoFormatCode(escaped.slice(codeStart));
    return <>{prose && renderProse(prose)}<div className="code-container"><pre className="code-block">{highlightCode(code)}</pre></div></>;
  }
  return renderProse(text);
}

export { ContentRenderer, autoFormatCode, looksLikeCode };

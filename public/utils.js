export function debounce(fn, delay) {
  let timeout = null;

  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(), delay);
  };
}

export function unindent(s) {
  const lines = s.replace(/^\n/, '').replace(/\n$/, '').split('\n');
  const indentation = lines[0].match(/^\s*/)[0].length;

  return lines.map((line) => line.slice(indentation)).join('\n');
}

export function format(template, values) {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => values[key]);
}

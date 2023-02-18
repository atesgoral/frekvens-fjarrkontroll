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

export function* chunks(binary, size) {
  for (let i = 0; i < binary.length; i += size) {
    yield binary.slice(i, i + size);
  }
}

export async function encode(binary) {
  return new Promise((resolve) => {
    const blob = new Blob([binary]);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const [_, base64] = dataUrl.split(',');

      resolve(base64);
    };

    reader.readAsDataURL(blob);
  });
}

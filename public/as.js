import asc from 'assemblyscript/asc';

export async function compile(source) {
  const {error, binary} = await asc.compileString(source, {
    use: ['Math=NativeMathf'],
    // runtime: 'stub',
  });

  if (error) {
    const re = new Error('Compilation failed');
    re.cause = error;
    throw re;
  }

  return binary;
}

export async function instantiate(binary) {
  const {error, instance} = await WebAssembly.instantiate(binary);

  if (error) {
    const re = new Error('Instantiation failed');
    re.cause = error;
    throw re;
  }

  return instance;
}

export function hexDump(binary, cols = 12) {
  return Array.from(binary)
    .map(
      (byte, i) =>
        `0x${byte.toString(16).padStart(2, '0')}${
          i % cols === cols - 1 ? ',\n' : ', '
        }`,
    )
    .join('');
}

export const status = {
  init(statusEl) {
    this.set = (text, options) => {
      statusEl.setAttribute('error', options?.error || '');
      statusEl.replaceChildren(text && document.createTextNode(text));
    };
    this.clear = () => this.set('');
  },
};

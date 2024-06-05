const pattern = /^\[!(info)\] /

const blockquotes = document.querySelectorAll('blockquote');

for (const blockquote of blockquotes) {
  const p = blockquote.querySelector('p')
  if (!p) continue;

  const matches = p.innerText.match(pattern)
  if (!matches) continue;

  const match = matches[0]
  const type = matches[1]
  const content = p.innerText.slice(match.length)
  const callout = createCallout(content, type)
  blockquote.insertAdjacentHTML('beforebegin', callout)
  blockquote.remove()
}

function createCallout(content, type) {
  const html = `
    <div style="
      background-color: #3b2e58;
      border-radius: 0.375rem;
      padding: 1rem;
      color: #e6e6e6;
      font-size: 1rem;
      margin-bottom: var(--content-gap);
    ">
      <p style="
          color: #efd9fd;
          font-weight: 600;
          margin-bottom: 0;
          vertical-align: middle;
        ">
        <svg style="fill: #efd9fd; vertical-align: middle; margin-right: 0.5rem" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
          <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
        </svg>
        <span style="vertical-align: middle">Note</span>
      </p>
      <p style="margin-top: 1rem; margin-bottom: 0">${content}</p>
    </div>
  `
  return html
}

type ReceiptRow = {
  label: string
  value: string
}

type ReceiptSection = {
  title: string
  rows?: ReceiptRow[]
  paragraphs?: string[]
  bullets?: string[]
}

type DownloadBookingReceiptOptions = {
  fileName: string
  title: string
  subtitle?: string
  confirmationNumber: string
  sections: ReceiptSection[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderRows(rows: ReceiptRow[]) {
  return rows
    .map(
      (row) => `
        <div class="row">
          <span class="label">${escapeHtml(row.label)}</span>
          <span class="value">${escapeHtml(row.value)}</span>
        </div>`,
    )
    .join('')
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs.map((paragraph) => `<p class="paragraph">${escapeHtml(paragraph)}</p>`).join('')
}

function renderBullets(bullets: string[]) {
  return `<ul class="list">${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
}

export function downloadBookingReceipt(options: DownloadBookingReceiptOptions) {
  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const sectionsHtml = options.sections
    .map((section) => {
      const rowsHtml = section.rows?.length ? renderRows(section.rows) : ''
      const paragraphsHtml = section.paragraphs?.length ? renderParagraphs(section.paragraphs) : ''
      const bulletsHtml = section.bullets?.length ? renderBullets(section.bullets) : ''

      return `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          ${rowsHtml}
          ${paragraphsHtml}
          ${bulletsHtml}
        </section>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #172033;
        --muted: #5f6b7a;
        --line: #d7dee7;
        --panel: #f7f9fc;
        --accent: #0f766e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        font-family: Georgia, 'Times New Roman', serif;
        color: var(--ink);
        background: white;
      }
      .receipt {
        max-width: 860px;
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
      }
      .hero {
        padding: 32px;
        background: linear-gradient(135deg, #ecfeff 0%, #f8fafc 100%);
        border-bottom: 1px solid var(--line);
      }
      .eyebrow {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 0;
        font-size: 32px;
        line-height: 1.1;
      }
      .subtitle {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.6;
      }
      .meta {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 24px;
      }
      .meta-card,
      .section {
        padding: 24px;
      }
      .meta-card {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.8);
      }
      .meta-label {
        display: block;
        margin-bottom: 6px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .meta-value {
        font-size: 18px;
        font-weight: 700;
      }
      .section + .section {
        border-top: 1px solid var(--line);
      }
      h2 {
        margin: 0 0 16px;
        font-size: 18px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }
      .row:last-child { border-bottom: 0; }
      .label {
        color: var(--muted);
        font-size: 14px;
      }
      .value {
        font-size: 14px;
        font-weight: 700;
        text-align: right;
      }
      .paragraph {
        margin: 0 0 12px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.7;
      }
      .paragraph:last-child { margin-bottom: 0; }
      .list {
        margin: 0;
        padding-left: 20px;
        color: var(--ink);
      }
      .list li {
        margin: 0 0 8px;
        line-height: 1.6;
      }
      .footer {
        padding: 24px 32px 32px;
        color: var(--muted);
        font-size: 12px;
        text-align: center;
      }
      @media print {
        body { padding: 0; }
        .receipt { border: 0; border-radius: 0; }
      }
    </style>
  </head>
  <body>
    <article class="receipt">
      <header class="hero">
        <p class="eyebrow">TripAvail receipt</p>
        <h1>${escapeHtml(options.title)}</h1>
        ${options.subtitle ? `<p class="subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
        <div class="meta">
          <div class="meta-card">
            <span class="meta-label">Confirmation number</span>
            <span class="meta-value">${escapeHtml(options.confirmationNumber)}</span>
          </div>
          <div class="meta-card">
            <span class="meta-label">Generated</span>
            <span class="meta-value">${escapeHtml(generatedAt)}</span>
          </div>
        </div>
      </header>
      ${sectionsHtml}
      <footer class="footer">
        Saved from TripAvail. Keep this file with your booking records for support, check-in, and payment follow-up.
      </footer>
    </article>
  </body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = options.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
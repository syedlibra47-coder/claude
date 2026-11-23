// ============================================================
// Shared page-builder rendering engine.
//
// window.renderPageBlocks(blocks) turns a page's stored block
// array (Supabase custom_pages.layout) into HTML. It's loaded on
// BOTH custom-page.html (the live page) and admin.html (the editor's
// live preview), so what the admin sees while editing is exactly
// what publishes — same function, same output, every time.
// ============================================================

window.PAGE_BLOCK_TYPES = [
  { type: 'heading', label: 'Heading' },
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'columns', label: 'Columns (2 or 3 side-by-side)' },
  { type: 'community-listings', label: 'Live Listings (by community)' },
  { type: 'image-text-split', label: 'Image + Text Split' },
  { type: 'feature-grid', label: 'Feature Grid' },
  { type: 'gallery', label: 'Photo Gallery' },
  { type: 'video', label: 'YouTube Video' },
  { type: 'spacer', label: 'Spacer' },
  { type: 'divider', label: 'Divider' }
];

// Block types allowed *inside* a Columns block. Kept deliberately small —
// the compound widgets (feature-grid, gallery, video, columns itself)
// stay top-level only, so nesting can't spiral into arbitrary depth.
window.PAGE_BLOCK_NESTABLE_TYPES = ['heading', 'text', 'image', 'button', 'spacer', 'divider'];

function pbEscapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pbBlockClasses(block) {
  const style = block.style || {};
  const classes = ['pb-block', 'pb-' + block.type];
  classes.push('pb-spacing-' + (style.spacing || 'normal'));
  if (style.background) classes.push('pb-bg-' + style.background);
  return classes.join(' ');
}

// Lightweight renderer for blocks nested inside a Columns block — no
// outer <section>/<div class="container"> wrapper (the column itself
// already sits inside one) and no per-block spacing/background controls.
function pbRenderNestedBlock(block) {
  const p = block.props || {};
  switch (block.type) {
    case 'heading': {
      const level = ['h2', 'h3'].includes(p.level) ? p.level : 'h3';
      const align = p.align || 'left';
      return `<${level} class="pb-column-heading" style="text-align:${align};">${pbEscapeHtml(p.text)}</${level}>`;
    }
    case 'text': {
      const align = p.align || 'left';
      const paras = String(p.text || '').split(/\n{2,}/).filter(Boolean)
        .map(t => `<p>${pbEscapeHtml(t).replace(/\n/g, '<br>')}</p>`).join('');
      return `<div class="pb-column-text" style="text-align:${align};">${paras}</div>`;
    }
    case 'image':
      if (!p.src) return '';
      return `<div class="pb-column-image"><img src="${pbEscapeHtml(p.src)}" alt="${pbEscapeHtml(p.alt)}"></div>`;
    case 'button': {
      const align = p.align || 'left';
      const variant = p.variant === 'outline' ? 'btn-outline-navy' : (p.variant === 'navy' ? 'btn-navy' : 'btn-gold');
      return `<div class="pb-column-button" style="text-align:${align};"><a href="${pbEscapeHtml(p.href || '#')}" class="btn ${variant}">${pbEscapeHtml(p.label || 'Learn More')}</a></div>`;
    }
    case 'spacer': {
      const height = Number(p.height) > 0 ? Number(p.height) : 20;
      return `<div style="height:${height}px;"></div>`;
    }
    case 'divider':
      return `<hr class="pb-divider">`;
    default:
      return '';
  }
}

function pbRenderBlock(block) {
  const p = block.props || {};
  const cls = pbBlockClasses(block);

  switch (block.type) {
    case 'heading': {
      const level = ['h1', 'h2', 'h3'].includes(p.level) ? p.level : 'h2';
      const align = p.align || 'center';
      return `<section class="${cls}"><div class="container" style="text-align:${align};"><${level} class="display">${pbEscapeHtml(p.text)}</${level}></div></section>`;
    }
    case 'text': {
      const align = p.align || 'left';
      const paras = String(p.text || '').split(/\n{2,}/).filter(Boolean)
        .map(t => `<p>${pbEscapeHtml(t).replace(/\n/g, '<br>')}</p>`).join('');
      return `<section class="${cls}"><div class="container pb-text-inner" style="text-align:${align};">${paras}</div></section>`;
    }
    case 'image': {
      if (!p.src) return '';
      return `<section class="${cls}"><div class="container">
        <img src="${pbEscapeHtml(p.src)}" alt="${pbEscapeHtml(p.alt)}" class="pb-image-full">
        ${p.caption ? `<p class="pb-image-caption">${pbEscapeHtml(p.caption)}</p>` : ''}
      </div></section>`;
    }
    case 'button': {
      const align = p.align || 'center';
      const variant = p.variant === 'outline' ? 'btn-outline-navy' : (p.variant === 'navy' ? 'btn-navy' : 'btn-gold');
      return `<section class="${cls}"><div class="container" style="text-align:${align};">
        <a href="${pbEscapeHtml(p.href || '#')}" class="btn ${variant}">${pbEscapeHtml(p.label || 'Learn More')}</a>
      </div></section>`;
    }
    case 'columns': {
      const columns = p.columns && p.columns.length ? p.columns : [[], []];
      const colsHtml = columns.map(colBlocks => `<div class="pb-column">${(colBlocks || []).map(pbRenderNestedBlock).join('')}</div>`).join('');
      return `<section class="${cls}"><div class="container"><div class="pb-columns pb-columns-${columns.length}">${colsHtml}</div></div></section>`;
    }
    case 'community-listings': {
      const community = (p.community || '').trim();
      if (!community) return '';
      const max = Number(p.maxItems) > 0 ? Number(p.maxItems) : 3;
      const all = (window.LISTINGS_DATA && Object.values(window.LISTINGS_DATA)) || [];
      const matches = all.filter(l => (l.community || '').toLowerCase() === community.toLowerCase()).slice(0, max);
      if (!matches.length) return '';
      const cards = matches.map(l => `
        <a href="listing-detail.html?id=${pbEscapeHtml(l.id)}" class="pb-cl-card">
          <img src="${pbEscapeHtml(l.hero)}" alt="${pbEscapeHtml(l.title)}">
          <div class="pb-cl-card-body">
            <div class="pb-cl-price">${pbEscapeHtml(l.priceLabel)}${l.priceSuffix ? ' ' + pbEscapeHtml(l.priceSuffix) : ''}</div>
            <h4>${pbEscapeHtml(l.title)}</h4>
            <p>${l.beds === 'Studio' ? 'Studio' : pbEscapeHtml(l.beds) + ' Bed'} &middot; ${pbEscapeHtml(l.baths)} Bath &middot; ${pbEscapeHtml(l.sqft)} sqft</p>
          </div>
        </a>`).join('');
      return `<section class="${cls}"><div class="container">
        <div class="pb-cl-grid">${cards}</div>
        <div class="pb-cl-viewall"><a href="listings.html?q=${encodeURIComponent(community)}" class="btn btn-outline-navy">View All Listings in ${pbEscapeHtml(community)} &rarr;</a></div>
      </div></section>`;
    }
    case 'image-text-split': {
      const reverseClass = p.imagePosition === 'right' ? 'pb-split-reverse' : '';
      return `<section class="${cls} ${reverseClass}"><div class="container pb-split-inner">
        <div class="pb-split-media">${p.src ? `<img src="${pbEscapeHtml(p.src)}" alt="${pbEscapeHtml(p.alt)}">` : ''}</div>
        <div class="pb-split-content">
          <h3>${pbEscapeHtml(p.heading)}</h3>
          <p>${pbEscapeHtml(p.text)}</p>
          ${p.buttonLabel ? `<a href="${pbEscapeHtml(p.buttonHref || '#')}" class="btn btn-gold">${pbEscapeHtml(p.buttonLabel)}</a>` : ''}
        </div>
      </div></section>`;
    }
    case 'feature-grid': {
      const items = (p.items || []).map(it => {
        const tag = it.href ? 'a' : 'div';
        const hrefAttr = it.href ? ` href="${pbEscapeHtml(it.href)}"` : '';
        const media = it.image
          ? `<div class="pb-feature-image"><img src="${pbEscapeHtml(it.image)}" alt="${pbEscapeHtml(it.title)}" loading="lazy"></div>`
          : (it.icon ? `<div class="pb-feature-icon">${pbEscapeHtml(it.icon)}</div>` : '');
        return `
        <${tag} class="pb-feature${it.href ? ' pb-feature--link' : ''}${it.image ? ' pb-feature--photo' : ''}"${hrefAttr}>
          ${media}
          <div class="pb-feature-body">
            <h3>${pbEscapeHtml(it.title)}</h3>
            <p>${pbEscapeHtml(it.text)}</p>
          </div>
        </${tag}>`;
      }).join('');
      const colsClass = p.columns ? ` pb-feature-grid-inner--cols-${pbEscapeHtml(p.columns)}` : '';
      return `<section class="${cls}"><div class="container"><div class="pb-feature-grid-inner${colsClass}">${items}</div></div></section>`;
    }
    case 'gallery': {
      const imgs = (p.images || []).map(img => `<div class="pb-gallery-item"><img src="${pbEscapeHtml(img.src)}" alt="${pbEscapeHtml(img.alt)}"></div>`).join('');
      return `<section class="${cls}"><div class="container"><div class="pb-gallery-grid">${imgs}</div></div></section>`;
    }
    case 'video': {
      if (!p.videoId) return '';
      return `<section class="${cls}"><div class="container pb-video-inner">
        <div class="pb-video-frame"><iframe src="https://www.youtube.com/embed/${pbEscapeHtml(p.videoId)}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
        ${p.caption ? `<p class="pb-image-caption">${pbEscapeHtml(p.caption)}</p>` : ''}
      </div></section>`;
    }
    case 'spacer': {
      const height = Number(p.height) > 0 ? Number(p.height) : 40;
      return `<div class="pb-spacer" style="height:${height}px;"></div>`;
    }
    case 'divider': {
      return `<div class="container"><hr class="pb-divider"></div>`;
    }
    default:
      return '';
  }
}

window.renderPageBlocks = function (blocks) {
  return (blocks || []).map(pbRenderBlock).join('\n');
};

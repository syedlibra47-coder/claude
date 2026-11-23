(async function () {
  if (window.dataReady) await window.dataReady;

  const heading = document.getElementById('customPageHeading');
  const blocksContainer = document.getElementById('customPageBlocks');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  function notFound() {
    heading.textContent = 'Page Not Found';
    document.title = 'Page Not Found — HomesPartner Real Estate';
    blocksContainer.innerHTML = '<div class="container" style="padding:60px 0;text-align:center;"><p><a href="index.html">Return to homepage &rarr;</a></p></div>';
  }

  if (!slug || !window.SUPABASE_URL || !window.supabase) { notFound(); return; }

  try {
    const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const { data, error } = await client.from('custom_pages').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();

    if (error || !data) { notFound(); return; }

    document.title = `${data.title} — HomesPartner Real Estate`;
    document.getElementById('pageTitleTag').textContent = `${data.title} — HomesPartner Real Estate`;
    const metaDesc = document.getElementById('pageMetaDescription');
    if (metaDesc && data.seo_description) metaDesc.setAttribute('content', data.seo_description);
    heading.textContent = data.title;

    if (window.renderPageBlocks) {
      blocksContainer.innerHTML = window.renderPageBlocks(data.layout || []);
    }
  } catch (err) {
    console.error(err);
    notFound();
  }
})();

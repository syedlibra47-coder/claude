(function () {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  const emailInput = document.getElementById('newsletterEmail');
  const submitBtn = document.getElementById('newsletterSubmitBtn');
  const note = document.getElementById('newsletterNote');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    note.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = '...';
    try {
      if (!window.SUPABASE_URL || !window.supabase) throw new Error('not configured');
      const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      const { error } = await client.from('newsletter_subscribers').insert({ email: emailInput.value });
      if (error) {
        if (error.code === '23505') { // unique violation - already subscribed
          note.textContent = "You're already subscribed!";
        } else {
          throw error;
        }
      } else {
        note.textContent = 'Subscribed — thanks!';
        form.reset();
      }
    } catch (err) {
      note.textContent = 'Something went wrong — please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Subscribe';
    }
  });
})();

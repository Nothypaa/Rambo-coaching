// Completes the GitHub OAuth flow for Sveltia CMS: exchanges the temporary
// code for an access token, then hands it back to the CMS window via
// postMessage (the format Decap CMS defined and Sveltia CMS accepts).
module.exports = async (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const code = req.query && req.query.code;

  function page(status, payload) {
    const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(${JSON.stringify(message)}, e.origin);
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body></html>`;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!clientId || !clientSecret) {
    res.status(500).send(page('error', { error: 'Missing OAuth environment variables' }));
    return;
  }
  if (!code) {
    res.status(400).send(page('error', { error: 'Missing authorization code' }));
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const data = await tokenRes.json();

    if (data.access_token) {
      res.status(200).send(page('success', { token: data.access_token, provider: 'github' }));
    } else {
      res.status(200).send(page('error', { error: data.error_description || data.error || 'No access token returned' }));
    }
  } catch (err) {
    res.status(200).send(page('error', { error: String(err) }));
  }
};

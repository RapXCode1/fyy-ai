// Minimal example backend for OAuth exchange and deep-link redirect
// WARNING: This is a demo. Replace the exchange logic with real Clerk API calls and secure storage.

const express = require('express')
const fetch = require('node-fetch')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = process.env.PORT || 4000

// Example callback route that Clerk would redirect to with ?code=...
app.get('/auth/clerk/callback', async (req, res) => {
  const { code, state } = req.query

  if (!code) {
    return res.status(400).send('Missing code')
  }

  try {
    // TODO: Exchange `code` with Clerk for a session or tokens.
    // Example (pseudo):
    // const tokenResp = await fetch('https://api.clerk.dev/exchange', { method: 'POST', body: ... })
    // const sessionToken = await tokenResp.text()

    // For demo, create a one-time token and store it in-memory (DO NOT use in production)
    const sessionToken = uuidv4()

    // Ideally store sessionToken server-side mapped to a valid session and mark one-time use.

    // Redirect back to the app using custom scheme. App will handle the deep link and set session in WebView.
    const redirectUrl = `fyyai://sync?session_token=${encodeURIComponent(sessionToken)}`
    return res.redirect(302, redirectUrl)
  } catch (err) {
    console.error('Callback error', err)
    return res.status(500).send('Internal error')
  }
})

app.listen(PORT, () => {
  console.log(`Auth backend example listening on http://localhost:${PORT}`)
})

const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: '../.env' })

const app = express()
app.use(cors())
app.use(express.json())

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

app.post('/api/chat', async (req, res) => {
  const { messages, systemContext } = req.body

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not configured' })
  }

  const formatted = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemContext || 'You are a helpful physical therapy assistant.' },
          ...formatted,
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? 'No response.'
    res.json({ reply })
  } catch (err) {
    console.error('DeepSeek error:', err)
    res.status(500).json({ error: 'Failed to reach AI service.' })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const PORT = 3001
app.listen(PORT, () => console.log(`PT server running on http://localhost:${PORT}`))

const BASE = 'http://localhost:3100/api'   // ajuste a porta/prefixo
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0MmFiMTFjLTdkYjktNDk4OC1hMDE2LTgzNzk4ZTliZjM3MiIsIm5vbWUiOiJGZXJuYW5kYSBTb3V6YSIsInBlcmZpbCI6InJlY2VwY2FvIiwiaWF0IjoxNzkyMDkwMzIzLCJleHAiOjE3OTIxMTkxMjN9.HYyfxpQnpTqbv-GHE8EDLj7WEFntX5OfblJ6y0CyQZ4'
const PROFISSIONAL_ID = "e134f676-727e-4103-8b33-4159bc592560"
const DATA = '2026-10-19'                // dia útil futuro
const HORA = '17:00'                     // horário da grade
const TENTATIVAS = 10

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
}

const marcar = () =>
  fetch(`${BASE}/consultas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      profissionalId: PROFISSIONAL_ID,
      data: DATA,
      hora: HORA,
      tipo: 'primeira',
      pacienteId: '007d2ebb-dc9a-441d-8636-9c19b97550e5'
    }),
  }).then(async (r) => ({ status: r.status, corpo: await r.json().catch(() => null) })).then((r) => {
    if (r.status !== 201) console.log('Falha ao marcar:', r.status, r.corpo)
    return r
  })

const resultados = await Promise.all(Array.from({ length: TENTATIVAS }, marcar))

const contagem = {}
for (const r of resultados) contagem[r.status] = (contagem[r.status] ?? 0) + 1
console.log('Status recebidos:', contagem)

const criadas = resultados.filter((r) => r.status === 201)
console.log(criadas.length === 1 ? 'OK: só 1 consulta criada' : `BUG: ${criadas.length} consultas criadas no mesmo horário`)

// Limpeza: cancela o que foi criado para não atrapalhar a migration
for (const { corpo } of criadas) {
  await fetch(`${BASE}/consultas/${corpo.id}/cancelar`, { method: 'POST', headers })
}
console.log(`${criadas.length} consulta(s) cancelada(s) na limpeza`)

// EXEMPLO DE RESPOSTA REAL:
// Falha ao marcar: 409 { erro: 'Esse horário já está ocupado' }
// Falha ao marcar: 409 { erro: 'Esse horário já está ocupado' }
// Status recebidos: { '201': 8, '409': 2 }
// BUG: 8 consultas criadas no mesmo horário
// 8 consulta(s) cancelada(s) na limpeza
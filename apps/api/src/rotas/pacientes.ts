import { Router } from 'express'
import { permitir } from '../auth'
import { prisma } from '../prisma'

export const rotasPacientes = Router()

rotasPacientes.get('/', permitir('recepcao'), async (_req, res) => {
  const pacientes = await prisma.usuario.findMany({
    where: { perfil: 'paciente' },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: 'asc' },
  })
  res.json(pacientes)
})

rotasPacientes.get('/:id/historico', permitir('recepcao'), async (req, res) => {
  const paciente = await prisma.usuario.findFirst({
    where: { id: req.params.id, perfil: 'paciente' },
    select: { id: true },
  })

  if (!paciente) {
    res.status(404).json({ erro: 'Paciente não encontrado' })
    return
  }

  const consultas = await prisma.consulta.findMany({
    where: { pacienteId: paciente.id, inicio: { lte: new Date() } },
    include: {
      profissional: {
        include: { usuario: { select: { nome: true } } },
      },
    },
    orderBy: [{ data: 'desc' }, { inicio: 'desc' }],
  })

  res.json(
    consultas.map(({ profissional, ...consulta }) => ({
      ...consulta,
      profissionalNome: profissional.usuario.nome,
      especialidade: profissional.especialidade,
    })),
  )
})

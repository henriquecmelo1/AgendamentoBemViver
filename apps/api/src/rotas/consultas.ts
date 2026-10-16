import { Router } from 'express'
import { DURACAO_MINUTOS, hojeEmRecife, podeCancelarConsulta, type TipoConsulta } from '@bemviver/shared'
import { ehTipoConsulta, instante, temConflito, validarHorario } from '../agenda'
import { permitir } from '../auth'
import { prisma } from '../prisma'

export const rotasConsultas = Router()

async function tratarMarcacaoUrgente(dados: {
  profissionalId: string
  pacienteId: string
  data: string
  hora: string
  tipo: TipoConsulta
  inicio: Date
  fim: Date
}) {
  return prisma.$transaction(async (tx) => {
    const marcadas = await tx.consulta.findMany({
      where: { profissionalId: dados.profissionalId, data: dados.data, status: 'agendada' },
    })
    const conflitos = marcadas.filter((consulta) => temConflito([consulta], dados))
    const idsSubstituidos = new Set(conflitos.map((consulta) => consulta.id))
    const consultasDoPaciente = await tx.consulta.findMany({
      where: { pacienteId: dados.pacienteId, data: dados.data, status: 'agendada' },
    })
    if (temConflito(consultasDoPaciente.filter((consulta) => !idsSubstituidos.has(consulta.id)), dados)) {
      return { erro: 'paciente' as const }
    }

    if (conflitos.length > 0) {
      await tx.consulta.updateMany({
        where: { id: { in: conflitos.map((consulta) => consulta.id) }, status: 'agendada' },
        data: { status: 'cancelada', canceladaEm: new Date() },
      })
    }

    const consulta = await tx.consulta.create({ data: dados })
    return { consulta, consultasCanceladas: conflitos.length }
  })
}

rotasConsultas.get('/minhas', permitir('paciente'), async (req, res) => {
  const consultas = await prisma.consulta.findMany({
    where: { pacienteId: req.usuario.id, data: { gte: hojeEmRecife() } },
    include: { profissional: { include: { usuario: { select: { nome: true } } } } },
    orderBy: { inicio: 'asc' },
  })

  res.json(
    consultas.map(({ profissional, ...consulta }) => ({
      ...consulta,
      profissionalNome: profissional.usuario.nome,
      especialidade: profissional.especialidade,
    })),
  )
})

rotasConsultas.post('/', permitir('paciente', 'recepcao'), async (req, res) => {
  const profissionalId = String(req.body?.profissionalId ?? '')
  const data = String(req.body?.data ?? '')
  const hora = String(req.body?.hora ?? '')
  const tipo = req.body?.tipo
  const urgente = req.body?.urgente ?? false
  // O paciente só marca para ele mesmo. A recepção escolhe o paciente.
  const pacienteId = req.usuario.perfil === 'paciente' ? req.usuario.id : String(req.body?.pacienteId ?? '')

  if (typeof urgente !== 'boolean') {
    res.status(400).json({ erro: 'Informe se a consulta é uma urgência' })
    return
  }
  if (urgente && req.usuario.perfil !== 'recepcao') {
    res.status(403).json({ erro: 'Só a recepção pode marcar uma urgência' })
    return
  }
  if (!ehTipoConsulta(tipo)) {
    res.status(400).json({ erro: 'Informe o tipo da consulta' })
    return
  }
  const motivo = validarHorario(data, hora, tipo)
  if (motivo) {
    res.status(400).json({ erro: motivo })
    return
  }

  const [paciente, profissional] = await Promise.all([
    prisma.usuario.findFirst({ where: { id: pacienteId, perfil: 'paciente' } }),
    prisma.profissional.findUnique({ where: { id: profissionalId } }),
  ])
  if (!paciente || !profissional) {
    res.status(400).json({ erro: 'Paciente ou profissional não encontrado' })
    return
  }

  const folga = await prisma.folga.findUnique({ where: { profissionalId_data: { profissionalId, data } } })
  if (folga) {
    res.status(409).json({ erro: 'O profissional está de folga nesse dia' })
    return
  }

  const inicio = instante(data, hora)
  const fim = new Date(inicio.getTime() + DURACAO_MINUTOS[tipo] * 60_000)
  const dadosConsulta = { profissionalId, pacienteId, data, hora, tipo, inicio, fim }

  if (urgente) {
    const resultado = await tratarMarcacaoUrgente(dadosConsulta)
    if ('erro' in resultado) {
      res.status(409).json({ erro: 'O paciente já tem uma consulta nesse horário' })
      return
    }
    res.status(201).json({ ...resultado.consulta, consultasCanceladas: resultado.consultasCanceladas })
    return
  }

  const marcadas = await prisma.consulta.findMany({ where: { profissionalId, data, status: 'agendada' } })
  if (temConflito(marcadas, { hora, tipo })) {
    res.status(409).json({ erro: 'Esse horário já está ocupado' })
    return
  }

  const consultasDoPaciente = await prisma.consulta.findMany({ where: { pacienteId, data, status: 'agendada' } })
  if (temConflito(consultasDoPaciente, { hora, tipo })) {
    res.status(409).json({
      erro:
        req.usuario.perfil === 'paciente'
          ? 'Você já tem uma consulta nesse horário'
          : 'O paciente já tem uma consulta nesse horário',
    })
    return
  }

  const consulta = await prisma.consulta.create({ data: dadosConsulta })
  res.status(201).json(consulta)
})

rotasConsultas.post('/:id/cancelar', permitir('paciente', 'recepcao'), async (req, res) => {
  const consulta = await prisma.consulta.findUnique({ where: { id: req.params.id } })

  if (!consulta) {
    res.status(404).json({ erro: 'Consulta não encontrada' })
    return
  }
  if (req.usuario.perfil === 'paciente' && consulta.pacienteId !== req.usuario.id) {
    res.status(403).json({ erro: 'Você só pode cancelar suas próprias consultas' })
    return
  }
  if (consulta.status !== 'agendada') {
    res.status(409).json({ erro: 'Só é possível cancelar uma consulta agendada' })
    return
  }
  if (req.usuario.perfil === 'paciente' && !podeCancelarConsulta(consulta.inicio)) {
    res.status(409).json({ erro: 'Só é possível cancelar consultas com pelo menos 24 horas de antecedência' })
    return
  }

  const cancelada = await prisma.consulta.update({
    where: { id: consulta.id },
    data: { status: 'cancelada', canceladaEm: new Date() },
  })
  res.json(cancelada)
})

rotasConsultas.post('/:id/falta', permitir('recepcao'), async (req, res) => {
  const consulta = await prisma.consulta.findUnique({ where: { id: req.params.id } })

  if (!consulta) {
    res.status(404).json({ erro: 'Consulta não encontrada' })
    return
  }
  if (consulta.status !== 'agendada') {
    res.status(409).json({ erro: 'Só é possível registrar falta em uma consulta agendada' })
    return
  }
  if (consulta.inicio > new Date()) {
    res.status(409).json({ erro: 'A falta só pode ser registrada depois do horário da consulta' })
    return
  }

  const atualizada = await prisma.consulta.update({ where: { id: consulta.id }, data: { status: 'faltou' } })
  res.json(atualizada)
})

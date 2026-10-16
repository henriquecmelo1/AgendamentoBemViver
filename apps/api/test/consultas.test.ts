import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { prisma } from '../src/prisma'
import { criarConsulta, criarUsuario, proximaSegunda } from './ajuda'

function dataHoraRecife(instante: Date) {
  const partes = new Map(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Recife',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instante)
      .map(({ type, value }) => [type, value]),
  )

  return {
    data: `${partes.get('year')}-${partes.get('month')}-${partes.get('day')}`,
    hora: `${partes.get('hour')}:${partes.get('minute')}`,
  }
}

async function criarConsultaEmHoras(profissionalId: string, pacienteId: string, horas: number) {
  const { data, hora } = dataHoraRecife(new Date(Date.now() + horas * 60 * 60 * 1000))
  return criarConsulta({ profissionalId, pacienteId, data, hora })
}

describe('cancelamento de consultas', () => {
  it('impede o paciente de cancelar com menos de 24 horas de antecedência', async () => {
    const paciente = await criarUsuario('paciente')
    const profissional = await criarUsuario('profissional')
    const consulta = await criarConsultaEmHoras(profissional.id, paciente.id, 23)

    const resposta = await request(app)
      .post(`/consultas/${consulta.id}/cancelar`)
      .set('Authorization', paciente.auth)

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toContain('24 horas')
    await expect(prisma.consulta.findUnique({ where: { id: consulta.id } })).resolves.toMatchObject({
      status: 'agendada',
      canceladaEm: null,
    })
  })

  it('permite o paciente cancelar com pelo menos 24 horas de antecedência', async () => {
    const paciente = await criarUsuario('paciente')
    const profissional = await criarUsuario('profissional')
    const consulta = await criarConsultaEmHoras(profissional.id, paciente.id, 25)

    const resposta = await request(app)
      .post(`/consultas/${consulta.id}/cancelar`)
      .set('Authorization', paciente.auth)

    expect(resposta.status).toBe(200)
    expect(resposta.body.status).toBe('cancelada')
  })

  it('não permite que um paciente cancele a consulta de outra pessoa', async () => {
    const paciente = await criarUsuario('paciente')
    const outroPaciente = await criarUsuario('paciente')
    const profissional = await criarUsuario('profissional')
    const consulta = await criarConsultaEmHoras(profissional.id, outroPaciente.id, 25)

    const resposta = await request(app)
      .post(`/consultas/${consulta.id}/cancelar`)
      .set('Authorization', paciente.auth)

    expect(resposta.status).toBe(403)
  })

  it('mantém a recepção autorizada a cancelar com menos de 24 horas', async () => {
    const paciente = await criarUsuario('paciente')
    const recepcao = await criarUsuario('recepcao')
    const profissional = await criarUsuario('profissional')
    const consulta = await criarConsultaEmHoras(profissional.id, paciente.id, 1)

    const resposta = await request(app)
      .post(`/consultas/${consulta.id}/cancelar`)
      .set('Authorization', recepcao.auth)

    expect(resposta.status).toBe(200)
    expect(resposta.body.status).toBe('cancelada')
  })
})

describe('agendamento urgente', () => {
  it('permite à recepção substituir duas consultas de 30 minutos por uma de uma hora', async () => {
    const recepcao = await criarUsuario('recepcao')
    const profissional = await criarUsuario('profissional')
    const pacienteUm = await criarUsuario('paciente')
    const pacienteDois = await criarUsuario('paciente')
    const pacienteUrgencia = await criarUsuario('paciente')
    const data = proximaSegunda()
    const primeiraConsulta = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: pacienteUm.id,
      data,
      hora: '10:00',
      tipo: 'retorno',
    })
    const segundaConsulta = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: pacienteDois.id,
      data,
      hora: '10:30',
      tipo: 'retorno',
    })

    const resposta = await request(app)
      .post('/consultas')
      .set('Authorization', recepcao.auth)
      .send({
        profissionalId: profissional.id,
        pacienteId: pacienteUrgencia.id,
        data,
        hora: '10:00',
        tipo: 'primeira',
        urgente: true,
      })

    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ consultasCanceladas: 2 })
    expect(resposta.body).not.toHaveProperty('urgente')
    await expect(
      prisma.consulta.findMany({ where: { id: { in: [primeiraConsulta.id, segundaConsulta.id] } } }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'cancelada', canceladaEm: expect.any(Date) }),
        expect.objectContaining({ status: 'cancelada', canceladaEm: expect.any(Date) }),
      ]),
    )
  })

  it('não deixa paciente marcar urgência nem cancela consultas existentes', async () => {
    const paciente = await criarUsuario('paciente')
    const profissional = await criarUsuario('profissional')
    const pacienteAgendado = await criarUsuario('paciente')
    const consulta = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: pacienteAgendado.id,
      data: proximaSegunda(),
      hora: '10:00',
    })

    const resposta = await request(app)
      .post('/consultas')
      .set('Authorization', paciente.auth)
      .send({ profissionalId: profissional.id, data: consulta.data, hora: '10:00', tipo: 'primeira', urgente: true })

    expect(resposta.status).toBe(403)
    await expect(prisma.consulta.findUnique({ where: { id: consulta.id } })).resolves.toMatchObject({
      status: 'agendada',
      canceladaEm: null,
    })
  })

  it('substitui a consulta do mesmo paciente marcada com outro profissional', async () => {
    const recepcao = await criarUsuario('recepcao')
    const outroProfissional = await criarUsuario('profissional')
    const profissionalDaUrgencia = await criarUsuario('profissional')
    const pacienteUrgencia = await criarUsuario('paciente')
    const data = proximaSegunda()
    const consultaExistente = await criarConsulta({
      profissionalId: outroProfissional.id,
      pacienteId: pacienteUrgencia.id,
      data,
      hora: '10:00',
      tipo: 'retorno',
    })

    const resposta = await request(app)
      .post('/consultas')
      .set('Authorization', recepcao.auth)
      .send({
        profissionalId: profissionalDaUrgencia.id,
        pacienteId: pacienteUrgencia.id,
        data,
        hora: '10:00',
        tipo: 'primeira',
        urgente: true,
      })

    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({
      profissionalId: profissionalDaUrgencia.id,
      pacienteId: pacienteUrgencia.id,
      consultasCanceladas: 1,
    })
    await expect(prisma.consulta.findUnique({ where: { id: consultaExistente.id } })).resolves.toMatchObject({
      status: 'cancelada',
      canceladaEm: expect.any(Date),
    })
  })
})
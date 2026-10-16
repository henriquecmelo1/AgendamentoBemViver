import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { prisma } from '../src/prisma'
import { criarConsulta, criarUsuario, proximaSegunda, somarDias } from './ajuda'

describe('profissionais', () => {
  it('lista os profissionais com nome e especialidade', async () => {
    const paciente = await criarUsuario('paciente')
    const profissional = await criarUsuario('profissional', 'Dra. Teste')

    const resposta = await request(app).get('/profissionais').set('Authorization', paciente.auth)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual([{ id: profissional.id, nome: 'Dra. Teste', especialidade: 'Clínica geral' }])
  })

  it('cancela as consultas agendadas do dia ao registrar uma folga', async () => {
    const profissional = await criarUsuario('profissional', 'Dra. Folga')
    const outroProfissional = await criarUsuario('profissional', 'Dr. Outro')
    const paciente = await criarUsuario('paciente')
    const sexta = somarDias(proximaSegunda(), 4)
    const outroDia = somarDias(sexta, 3)

    const consultaAgendada = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: paciente.id,
      data: sexta,
      hora: '09:00',
    })
    const consultaCancelada = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: paciente.id,
      data: sexta,
      hora: '10:00',
      status: 'cancelada',
    })
    const consultaRealizada = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: paciente.id,
      data: sexta,
      hora: '11:00',
      status: 'realizada',
    })
    const consultaOutroDia = await criarConsulta({
      profissionalId: profissional.id,
      pacienteId: paciente.id,
      data: outroDia,
      hora: '09:00',
    })
    const consultaOutroProfissional = await criarConsulta({
      profissionalId: outroProfissional.id,
      pacienteId: paciente.id,
      data: sexta,
      hora: '09:00',
    })

    const resposta = await request(app)
      .post(`/profissionais/${profissional.id}/folgas`)
      .set('Authorization', profissional.auth)
      .send({ data: sexta })

    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ profissionalId: profissional.id, data: sexta })

    const consultas = await prisma.consulta.findMany({
      where: {
        id: {
          in: [
            consultaAgendada.id,
            consultaCancelada.id,
            consultaRealizada.id,
            consultaOutroDia.id,
            consultaOutroProfissional.id,
          ],
        },
      },
    })
    const porId = new Map(consultas.map((consulta) => [consulta.id, consulta]))

    expect(porId.get(consultaAgendada.id)?.status).toBe('cancelada')
    expect(porId.get(consultaAgendada.id)?.canceladaEm).toBeInstanceOf(Date)
    expect(porId.get(consultaCancelada.id)?.status).toBe('cancelada')
    expect(porId.get(consultaRealizada.id)?.status).toBe('realizada')
    expect(porId.get(consultaOutroDia.id)?.status).toBe('agendada')
    expect(porId.get(consultaOutroProfissional.id)?.status).toBe('agendada')
  })
})

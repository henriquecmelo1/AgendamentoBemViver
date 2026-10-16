'use client'

import { useEffect, useState } from 'react'
import type { Agenda } from '@bemviver/shared'
import Alert from '@/components/atoms/Alert/alert'
import Button from '@/components/atoms/Button/button'
import Card from '@/components/atoms/Card/card'
import MarcarConsulta from '@/components/organisms/MarcarConsulta/marcarConsulta'
import TabelaConsultas from '@/components/organisms/TabelaConsultas/tabelaConsultas'
import { api } from '@/lib/api'
import ModalHistoricoPaciente from './modalHistoricoPaciente'
import type { ConsultaHistorico } from './modalHistoricoPaciente'
import type { AgendaDoDiaProps } from './types'

export default function AgendaDoDia({ profissionalId, data }: AgendaDoDiaProps) {
  const [agenda, setAgenda] = useState<Agenda | null>(null)
  const [erro, setErro] = useState('')
  const [atualizacao, setAtualizacao] = useState(0)
  const [pacienteSelecionado, setPacienteSelecionado] = useState<{ id: string; nome: string } | null>(null)
  const [historico, setHistorico] = useState<ConsultaHistorico[]>([])
  const [historicoCarregando, setHistoricoCarregando] = useState(false)
  const [erroHistorico, setErroHistorico] = useState('')

  useEffect(() => {
    api<Agenda>(`/profissionais/${profissionalId}/agenda?data=${data}`)
      .then((resposta) => {
        setAgenda(resposta)
        setErro('')
      })
      .catch((e: Error) => setErro(e.message))
  }, [profissionalId, data, atualizacao])

  function recarregar() {
    setAtualizacao((n) => n + 1)
  }

  async function executar(acao: 'cancelar' | 'falta', consultaId: string) {
    try {
      await api(`/consultas/${consultaId}/${acao}`, { metodo: 'POST' })
      recarregar()
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function abrirHistorico(pacienteId: string, pacienteNome: string) {
    setPacienteSelecionado({ id: pacienteId, nome: pacienteNome })
    setHistorico([])
    setErroHistorico('')
    setHistoricoCarregando(true)

    try {
      const consultas = await api<ConsultaHistorico[]>(`/pacientes/${pacienteId}/historico`)
      setHistorico(consultas)
    } catch (e) {
      setErroHistorico((e as Error).message)
    } finally {
      setHistoricoCarregando(false)
    }
  }

  if (!agenda) {
    return erro ? <Alert>{erro}</Alert> : <p className="text-sm text-gray-500">Carregando agenda...</p>
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold first-letter:uppercase">
          {new Date(`${agenda.data}T00:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
        </h2>
        {agenda.folga && <Alert variante="aviso">Dia bloqueado como folga do profissional.</Alert>}
        {erro && <Alert>{erro}</Alert>}
        <TabelaConsultas
          consultas={agenda.consultas}
          acoes={(consulta) =>
            <div className="flex justify-end gap-2">
              {consulta.status === 'agendada' && (
                <>
                  {new Date(consulta.inicio) <= new Date() && (
                    <Button variante="secundario" tamanho="compacto" onClick={() => executar('falta', consulta.id)}>
                      Registrar falta
                    </Button>
                  )}
                  <Button variante="secundario" tamanho="compacto" onClick={() => executar('cancelar', consulta.id)}>
                    Cancelar
                  </Button>
                </>
              )}
              <Button
                variante="secundario"
                tamanho="compacto"
                onClick={() => abrirHistorico(consulta.pacienteId, consulta.pacienteNome ?? 'Paciente')}
                disabled={historicoCarregando}
              >
                Histórico
              </Button>
            </div>
          }
        />
      </Card>
      <MarcarConsulta profissionalId={profissionalId} data={data} onMarcada={recarregar} />
      <ModalHistoricoPaciente
        aberto={pacienteSelecionado !== null}
        pacienteNome={pacienteSelecionado?.nome ?? ''}
        consultas={historico}
        carregando={historicoCarregando}
        erro={erroHistorico}
        onFechar={() => setPacienteSelecionado(null)}
      />
    </div>
  )
}

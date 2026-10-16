'use client'

import { useEffect, useRef, useState } from 'react'
import type { Consulta } from '@bemviver/shared'
import Alert from '@/components/atoms/Alert/alert'
import Button from '@/components/atoms/Button/button'
import { NOME_STATUS, NOME_TIPO } from '@/lib/formato'

export interface ConsultaHistorico extends Consulta {
  profissionalNome: string
  especialidade: string
}

interface ModalHistoricoPacienteProps {
  aberto: boolean
  pacienteNome: string
  consultas: ConsultaHistorico[]
  carregando: boolean
  erro: string
  onFechar: () => void
}

export default function ModalHistoricoPaciente({
  aberto,
  pacienteNome,
  consultas,
  carregando,
  erro,
  onFechar,
}: ModalHistoricoPacienteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [aba, setAba] = useState<'geral' | 'faltas'>('geral')
  const consultasExibidas = aba === 'faltas' ? consultas.filter((consulta) => consulta.status === 'faltou') : consultas

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (aberto && !dialog.open) {
      setAba('geral')
      dialog.showModal()
    }
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="titulo-historico-paciente"
      className="m-auto w-[min(48rem,calc(100%-2rem))] max-w-none rounded-md p-0 shadow-xl backdrop:bg-gray-950/50"
      onClose={onFechar}
    >
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-historico-paciente" className="text-lg font-semibold">
              Histórico de consultas
            </h2>
            <p className="text-sm text-gray-600">{pacienteNome}</p>
          </div>
          <Button variante="secundario" onClick={onFechar} autoFocus>
            Fechar
          </Button>
        </div>

        <div role="tablist" aria-label="Seções do histórico" className="flex gap-2 border-b border-gray-200">
          <button
            id="aba-historico-geral"
            type="button"
            role="tab"
            aria-selected={aba === 'geral'}
            aria-controls="painel-historico"
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              aba === 'geral' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAba('geral')}
          >
            Geral
          </button>
          <button
            id="aba-historico-faltas"
            type="button"
            role="tab"
            aria-selected={aba === 'faltas'}
            aria-controls="painel-historico"
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              aba === 'faltas' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAba('faltas')}
          >
            Faltas
          </button>
        </div>

          <div
            id="painel-historico"
            role="tabpanel"
            aria-labelledby={aba === 'geral' ? 'aba-historico-geral' : 'aba-historico-faltas'}
          >
            {carregando && <p className="text-sm text-gray-500">Carregando histórico...</p>}
            {erro && <Alert>{erro}</Alert>}
            {!carregando && !erro && consultasExibidas.length === 0 && (
              <p className="text-sm text-gray-500">
                {aba === 'faltas'
                  ? 'Nenhuma falta registrada para este paciente.'
                  : 'Nenhuma consulta encontrada para este paciente.'}
              </p>
            )}
            {!carregando && !erro && consultasExibidas.length > 0 && (
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Data</th>
                      <th className="py-2 pr-4 font-medium">Horário</th>
                      <th className="py-2 pr-4 font-medium">Profissional</th>
                      <th className="py-2 pr-4 font-medium">Tipo</th>
                      <th className="py-2 font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultasExibidas.map((consulta) => (
                      <tr key={consulta.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4">
                          {new Date(`${consulta.data}T00:00:00Z`).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'UTC',
                          })}
                        </td>
                        <td className="py-2 pr-4">{consulta.hora}</td>
                        <td className="py-2 pr-4">
                          {consulta.profissionalNome} ({consulta.especialidade})
                        </td>
                        <td className="py-2 pr-4">{NOME_TIPO[consulta.tipo]}</td>
                        <td className="py-2">{NOME_STATUS[consulta.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>
    </dialog>
  )
}

'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (aberto && !dialog.open) dialog.showModal()
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

        {carregando && <p className="text-sm text-gray-500">Carregando histórico...</p>}
        {erro && <Alert>{erro}</Alert>}
        {!carregando && !erro && consultas.length === 0 && (
          <p className="text-sm text-gray-500">Nenhuma consulta encontrada para este paciente.</p>
        )}
        {!carregando && !erro && consultas.length > 0 && (
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
                {consultas.map((consulta) => (
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
    </dialog>
  )
}

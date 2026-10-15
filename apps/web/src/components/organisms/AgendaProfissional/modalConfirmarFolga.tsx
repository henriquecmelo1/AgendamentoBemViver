'use client'

import { useEffect, useRef } from 'react'
import Alert from '@/components/atoms/Alert/alert'
import Button from '@/components/atoms/Button/button'

interface ModalConfirmarFolgaProps {
  aberto: boolean
  quantidadeConsultas: number
  salvando: boolean
  onConfirmar: () => void
  onFechar: () => void
}

export default function ModalConfirmarFolga({
  aberto,
  quantidadeConsultas,
  salvando,
  onConfirmar,
  onFechar,
}: ModalConfirmarFolgaProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (aberto && !dialog.open) dialog.showModal()
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  const mensagem =
    quantidadeConsultas === 0
      ? 'Não há consultas agendadas para este dia.'
      : `Este dia tem ${quantidadeConsultas} consulta${quantidadeConsultas === 1 ? '' : 's'} agendada${quantidadeConsultas === 1 ? '' : 's'}. Ao confirmar a folga, ${quantidadeConsultas === 1 ? 'ela será cancelada' : 'todas serão canceladas'}.`

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="titulo-confirmar-folga"
      aria-describedby="descricao-confirmar-folga"
      className="m-auto w-[min(32rem,calc(100%-2rem))] max-w-none rounded-md p-0 shadow-xl backdrop:bg-gray-950/50"
      onCancel={(evento) => {
        if (salvando) evento.preventDefault()
      }}
      onClose={onFechar}
    >
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <h2 id="titulo-confirmar-folga" className="text-lg font-semibold">
            Confirmar folga?
          </h2>
          <div id="descricao-confirmar-folga">
            <Alert variante="aviso">{mensagem}</Alert>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variante="secundario" onClick={onFechar} disabled={salvando} autoFocus>
            Voltar
          </Button>
          <Button variante="perigo" onClick={onConfirmar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Confirmar folga'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
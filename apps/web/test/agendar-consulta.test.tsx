import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AgendarConsulta from '../src/components/organisms/AgendarConsulta/agendarConsulta'
import { simularApi } from './simular-api'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('agendamento de consulta', () => {
  it('filtra profissionais pela especialidade selecionada', async () => {
    simularApi((caminho) => {
      if (caminho === '/api/profissionais') {
        return [
          { id: '1', nome: 'Ana', especialidade: 'Cardiologia' },
          { id: '2', nome: 'Bruno', especialidade: 'Dermatologia' },
        ]
      }
      return {}
    })
    render(<AgendarConsulta />)

    const profissional = screen.getByLabelText('Profissional')
    await waitFor(() => expect(profissional.querySelectorAll('option')).toHaveLength(3))
    expect(screen.getByRole('option', { name: 'Ana (Cardiologia)' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Bruno (Dermatologia)' })).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Especialidade'), { target: { value: 'Dermatologia' } })

    expect(screen.queryByRole('option', { name: 'Ana (Cardiologia)' })).toBeNull()
    expect(screen.getByRole('option', { name: 'Bruno (Dermatologia)' })).toBeTruthy()
  })
})

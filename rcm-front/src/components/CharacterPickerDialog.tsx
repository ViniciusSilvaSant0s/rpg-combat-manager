import { useEffect, useRef, type KeyboardEvent } from 'react'
import { characters } from '../characters'
import CharacterSprite from './CharacterSprite'
import PixelCornerFrame from './PixelCornerFrame'

type CharacterPickerDialogProps = {
  selectedCharacterId: string | null
  onSelect: (characterId: string) => void
  onClose: () => void
}

function CharacterPickerDialog({ selectedCharacterId, onSelect, onClose }: CharacterPickerDialogProps) {
  const dialogReference = useRef<HTMLElement>(null)

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const dialog = dialogReference.current
    const selectedButton = dialog?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
    const firstButton = selectedButton ?? dialog?.querySelector<HTMLButtonElement>('button')
    firstButton?.focus()
    return () => trigger?.focus()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const buttons = Array.from(dialogReference.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    const first = buttons[0]
    const last = buttons.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-6">
      <section
        aria-labelledby="character-picker-title"
        aria-modal="true"
        className="flex max-h-[calc(100svh-48px)] w-full max-w-[800px] flex-col border border-[#c79a4e] bg-[#21170f] p-6 text-[#f5e4ba] shadow-2xl"
        onKeyDown={handleKeyDown}
        ref={dialogReference}
        role="dialog"
      >
        <h2 id="character-picker-title" className="mt-0 mb-4 font-[family-name:var(--font-display)] text-2xl">Escolher personagem</h2>
        <div className="grid min-h-0 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 overflow-y-auto p-2">
          {characters.map((character) => (
            <PixelCornerFrame
              as="button"
              aria-label={character.name}
              aria-pressed={selectedCharacterId === character.id}
              className={`grid cursor-pointer justify-items-center gap-2 border p-3 font-semibold hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2 ${selectedCharacterId === character.id ? 'border-[#f3d38a] bg-[#3a2a1b]' : 'border-[#8a6a38] bg-[#100c09]'}`}
              key={character.id}
              onClick={() => onSelect(character.id)}
              type="button"
            >
              <CharacterSprite characterId={character.id} label={character.name} />
              <span>{character.name}</span>
            </PixelCornerFrame>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" onClick={onClose} type="button">
            Cancelar
          </PixelCornerFrame>
        </div>
      </section>
    </div>
  )
}

export default CharacterPickerDialog

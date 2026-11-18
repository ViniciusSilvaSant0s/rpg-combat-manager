import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { combatantsService, type CombatantInput } from '../services/combatants'
import CharacterPickerDialog from '../components/CharacterPickerDialog'
import CharacterSprite from '../components/CharacterSprite'
import CombatIcon from '../components/CombatIcon'
import PixelCornerFrame from '../components/PixelCornerFrame'
import { useCombatants, type SavedCombatant } from '../combatantsContext'

type Input = CombatantInput
type Combatant = SavedCombatant
const empty: Input = { name: '', type: 'player', characterId: null, maximumHitPoints: 0, armorClass: 0 }
const button = 'min-h-11 cursor-pointer border border-[#a87939] bg-[#49331e] px-4 py-2 font-bold text-[#f5e4ba] hover:bg-[#604528] focus-visible:outline-3 focus-visible:outline-[#f8df9d] disabled:opacity-50'
const field = 'min-h-11 w-full border border-[#8a6a38] bg-[#100c09] px-3 text-[#f5e4ba]'
function dialogKeys(event: KeyboardEvent<HTMLElement>, close: () => void) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return }
  if (event.key !== 'Tab') return
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)'))
  if (!controls.length) return
  if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus() }
  else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus() }
}

export default function SavedCombatantsScreen({ onBack }: { onBack: () => void }) {
  const { items: cachedItems, setItems } = useCombatants()
  const hasInitialCache = useRef(cachedItems !== null)
  const items = cachedItems ?? []
  const [view, setView] = useState('cards')
  const [loading, setLoading] = useState(cachedItems === null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Combatant | null | undefined>(undefined)
  const [form, setForm] = useState<Input>(empty)
  const [picker, setPicker] = useState(false)
  const [deleting, setDeleting] = useState<Combatant | null>(null)
  const [combatCount, setCombatCount] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => { if (hasInitialCache.current && retry === 0) return; let active = true; setLoading(true); setError(''); combatantsService.list().then(data => { if (active) setItems(data) }).catch(() => { if (active) setError('Não foi possível carregar seus combatentes.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [retry, setItems])
  function open(item: Combatant | null) { setEditing(item); setForm(item ? { name: item.name, type: item.type, characterId: item.characterId, maximumHitPoints: item.maximumHitPoints, armorClass: item.armorClass } : empty); setError('') }
  async function save(event: FormEvent) { event.preventDefault(); if (pending) return; setPending(true); setError(''); try { const result = editing ? await combatantsService.update(editing.id, form) : await combatantsService.create(form); setItems(current => editing ? (current ?? []).map(item => item.id === result.id ? result : item) : [...(current ?? []), result]); setEditing(undefined) } catch { setError('Não foi possível salvar. Confira os dados e tente novamente.') } finally { setPending(false) } }
  async function remove() { if (!deleting || pending) return; setPending(true); setError(''); try { await combatantsService.remove(deleting.id); setItems(current => (current ?? []).filter(item => item.id !== deleting.id)); setDeleting(null) } catch { setError('Não foi possível excluir. Tente novamente.') } finally { setPending(false) } }
  async function openDelete(item: Combatant) { setError(''); setDeleting(item); setCombatCount(null); try { setCombatCount(await combatantsService.countCombats(item.id)) } catch { setError('Não foi possível consultar os combates vinculados.') } }
  return <main className="min-h-screen bg-[#160f0a] px-5 py-10 text-[#f5e4ba]"><div className="mx-auto max-w-5xl">
    <button className={button} onClick={onBack}>← Home</button><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl text-[#f2d184]">Meus combatentes</h1><p className="mt-2 text-[#cbb995]">Suas fichas para novas aventuras.</p></div><button className={button} onClick={() => open(null)}>+ Criar combatente</button></div>
    {error && <p role="alert" className="mt-4 text-[#ffaaa1]">{error}</p>}
    <div className="mt-7 flex flex-wrap items-end gap-3"><label className="block w-48">Visualização<select className={field} value={view} onChange={e => setView(e.target.value)}><option value="cards">Cards</option><option value="list">Lista</option></select></label><button className={button} type="button" disabled={loading} onClick={() => setRetry(value => value + 1)}>Atualizar</button></div>
    {loading ? <p role="status" className="mt-6">Carregando combatentes…</p> : error && !items.length ? <button className={`${button} mt-5`} onClick={() => setRetry(retry + 1)}>Tentar novamente</button> : !items.length ? <p className="mt-8">Você ainda não tem combatentes. Crie sua primeira ficha.</p> : <div className={view === 'cards' ? 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'mt-6 grid gap-3'}>
      {items.map(item => <article key={item.id} className={`border border-[#806037] bg-[#2a1d13] p-5 ${view === 'list' ? 'flex flex-wrap items-center justify-between gap-4' : ''}`}>
        <div className="flex min-w-0 items-center gap-3">
          {item.characterId && <CharacterSprite characterId={item.characterId} label={item.name} />}
          <div className="min-w-0"><h2 className="break-words text-xl text-[#f2d184]">{item.name}</h2>
            {view === 'cards' ? <div><p>{item.type === 'player' ? 'Jogador' : 'NPC'}</p><p><CombatIcon name="heart" />PV {item.maximumHitPoints}</p><p><CombatIcon name="shield" />CA {item.armorClass}</p></div> : <p>{item.type === 'player' ? 'Jogador' : 'NPC'} · PV {item.maximumHitPoints} · CA {item.armorClass}</p>}
          </div>
        </div>
        <div className={`flex gap-2 ${view === 'list' ? 'ml-auto' : 'mt-4'}`}><button className={button} onClick={() => open(item)}>Editar</button><button className={button} onClick={() => void openDelete(item)}>Excluir</button></div>
      </article>)}
    </div>}
    {editing !== undefined && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-6">
        <section role="dialog" aria-modal={picker ? undefined : true} aria-hidden={picker || undefined} inert={picker}
          onKeyDown={e => dialogKeys(e, () => { if (!pending) setEditing(undefined) })} aria-labelledby="saved-form-title"
          className="max-h-[calc(100svh-48px)] w-full max-w-[520px] overflow-y-auto border border-[#c79a4e] bg-[#21170f] p-7 text-[#f5e4ba] shadow-2xl">
          <form onSubmit={save} className="grid gap-4">
            <h2 id="saved-form-title" className="mt-0 mb-1 font-[family-name:var(--font-display)] text-2xl">{editing ? 'Editar Combatente' : 'Criar Combatente'}</h2>
            {error && <p role="alert" className="m-0 text-[#f08a8a]">{error}</p>}
            <div aria-label="Tipo" className="grid grid-cols-2" role="radiogroup">
              {(['player', 'npc'] as const).map((type, index) => (
                <button key={type} type="button" role="radio" aria-checked={form.type === type}
                  onClick={() => setForm({ ...form, type })}
                  className={`min-h-11 border border-[rgba(211,173,103,0.55)] bg-[rgba(58,42,27,0.8)] px-3 py-2 font-bold text-[#d6c4a2] transition focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#f8df9d] ${index === 0 ? 'rounded-l-sm' : '-ml-px rounded-r-sm'} ${form.type === type ? 'border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] text-[#26180b]' : ''}`}>
                  {type === 'player' ? 'Jogador' : 'NPC'}
                </button>
              ))}
            </div>
            <label className="grid gap-1.5 text-sm font-semibold">Nome
              <input autoFocus className="min-h-10 border border-[#8a6a38] bg-[#100c09] px-2 font-normal text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]" required maxLength={255} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-1.5 p-0 font-semibold"><CombatIcon name="heart" />PV (Pontos de Vida)</legend>
              <label className="sr-only" htmlFor="saved-maximum-hit-points">Vida máxima</label>
              <input id="saved-maximum-hit-points" className="min-h-10 w-full border border-[#8a6a38] bg-[#100c09] px-2 text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]" placeholder="vida máxima" type="number" required min="0" max="9999999999" step="1" value={form.maximumHitPoints} onChange={e => setForm({ ...form, maximumHitPoints: e.target.valueAsNumber })} />
              {editing && form.maximumHitPoints < editing.maximumHitPoints && <p className="mt-2 text-sm text-[#f3dfb4]">Nos combates vinculados, a vida atual que exceder o novo máximo será somada à vida adicional.</p>}
            </fieldset>
            <label className="grid gap-1.5 text-sm font-semibold"><span><CombatIcon name="shield" />CA (Classe de Armadura)</span>
              <input className="min-h-10 border border-[#8a6a38] bg-[#100c09] px-2 font-normal text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]" type="number" required min="0" max="9999999999" step="1" value={form.armorClass} onChange={e => setForm({ ...form, armorClass: e.target.valueAsNumber })} />
            </label>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-1.5 font-semibold">Personagem</legend>
              <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={() => setPicker(true)}>{form.characterId ? 'Mudar personagem' : 'Escolher personagem'}</PixelCornerFrame>
              {form.characterId && <><div className="mt-3"><CharacterSprite characterId={form.characterId} label="Personagem selecionado" /></div><PixelCornerFrame as="button" className="mt-2 min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={() => setForm({ ...form, characterId: null })}>Remover personagem</PixelCornerFrame></>}
            </fieldset>
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2 disabled:opacity-50" type="button" disabled={pending} onClick={() => setEditing(undefined)}>Cancelar</PixelCornerFrame>
              <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-4 py-2 font-bold text-[#26180b] hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2 disabled:opacity-50" disabled={pending || !form.name.trim()} type="submit">{pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar combatente'}</PixelCornerFrame>
            </div>
          </form>
        </section>
      </div>
    )}
    {picker && <CharacterPickerDialog selectedCharacterId={form.characterId} onClose={() => setPicker(false)} onSelect={id => { setForm({ ...form, characterId: id }); setPicker(false) }} />}
    {deleting && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"><section role="dialog" aria-modal="true" onKeyDown={e => dialogKeys(e, () => { if (!pending) setDeleting(null) })} aria-labelledby="delete-title" className="w-full max-w-md border border-[#c79a4e] bg-[#21170f] p-6"><h2 id="delete-title" className="text-xl">Excluir {deleting.name}?</h2><p className="my-4">{combatCount === null ? 'Consultando combates vinculados…' : `Esta ficha está em ${combatCount} ${combatCount === 1 ? 'combate' : 'combates'} e será excluída desses combates.`}</p>{error && <p role="alert">{error}</p>}<div className="flex gap-3"><button autoFocus className={button} disabled={pending} onClick={() => setDeleting(null)}>Cancelar</button><button className={button} disabled={pending || combatCount === null} onClick={remove}>{pending ? 'Excluindo…' : 'Confirmar exclusão'}</button></div></section></div>}
  </div></main>
}

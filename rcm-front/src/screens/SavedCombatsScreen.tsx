import { useEffect, useRef, useState, type FormEvent } from 'react'
import { combatsService, CombatConflict, type Participant, type SavedCombat } from '../services/combats'
import { combatantsService } from '../services/combatants'
import { sheetOwnerLabel, type SavedCombatant } from '../types/savedCombatant'
import type { Combatant, CombatantInput } from '../types/combatant'
import { orderCombatants } from '../combatantOrder'
import CharacterSprite from '../components/CharacterSprite'
import CombatIcon from '../components/CombatIcon'
import ConditionList from '../components/ConditionDisplay'
import CombatantFormDialog from '../components/CombatantFormDialog'
import { ConditionDialog } from '../components/ConditionPickerDialog'
import CombatScreen from './CombatScreen'

const button = 'min-h-11 cursor-pointer border border-[#a87939] bg-[#49331e] px-4 py-2 font-bold text-[#f5e4ba] hover:bg-[#604528] focus-visible:outline-3 focus-visible:outline-[#f8df9d] disabled:opacity-50'
const field = 'min-h-11 w-full border border-[#8a6a38] bg-[#100c09] px-3 text-[#f5e4ba]'
const primary = `${button} border-[#f3d38a] bg-[#c89943] text-[#26180b]`
function participantId() { const values = new Uint32Array(2); crypto.getRandomValues(values); return (values[0] & 0x1fffff) * 0x100000000 + values[1] || 1 }
function toCombatant(p: Participant, source: SavedCombatant): Combatant { return { ...source, id: String(p.id), currentHitPoints: p.currentHitPoints, additionalHitPoints: p.additionalHitPoints, initiative: p.initiative, naturalInitiative: p.naturalInitiative, conditions: p.conditions } }

type RouteProps = { id?: string; running: boolean; navigate: (path: string, options?: { replace?: boolean }) => void; setUnsafe: (unsafe: boolean) => void }

export default function SavedCombatsScreen({ onBack, route }: { onBack: () => void; route?: RouteProps }) {
  const routeRef = useRef(route)
  routeRef.current = route
  const [items, setItems] = useState<SavedCombat[]>([])
  const [sources, setSources] = useState<SavedCombatant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [active, setActive] = useState<SavedCombat | null>(null)
  const [running, setRunning] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<Combatant | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selectedCombatantIds, setSelectedCombatantIds] = useState<number[]>([])
  const [deleting, setDeleting] = useState<SavedCombat | null>(null)
  const [pending, setPending] = useState(false)
  const [formGeneration, setFormGeneration] = useState(0)
  const latest = useRef<SavedCombat | null>(null)
  const confirmed = useRef<SavedCombat | null>(null)
  const inFlight = useRef(false)
  const blocked = useRef(false)
  const dirty = useRef(false)
  const dialogTrigger = useRef<HTMLElement | null>(null)

  const [listRevision, setListRevision] = useState(0)
  const routeId = route?.id
  useEffect(() => {
    if (routeId) return
    let activeRequest = true
    setLoading(true)
    setError('')
    Promise.all([combatsService.list(), combatantsService.list()]).then(([combats, combatants]) => {
      if (!activeRequest) return
      setItems(combats)
      setSources(combatants)
    }).catch(() => {
      if (activeRequest) setError('Não foi possível carregar seus combates.')
    }).finally(() => {
      if (activeRequest) setLoading(false)
    })
    return () => { activeRequest = false }
  }, [routeId, listRevision])

  useEffect(() => {
    if (!route) return
    if (!route.id) { setActive(null); setRunning(false); setError(''); return }
    if (active?.id === Number(route.id)) return
    setActive(null)
    let cancelled = false
    setLoading(true); setError('')
    const id = Number(route.id)
    if (!Number.isSafeInteger(id) || id <= 0) { setLoading(false); setError('Combate não encontrado.'); return }
    Promise.all([combatsService.get(id), combatantsService.list()]).then(([combat, combatants]) => {
      if (cancelled) return
      setSources(combatants); open(combat)
      if (routeRef.current?.running) {
        if (combat.started && combat.participants.some(p => combatants.some(c => c.id === p.combatantId))) setRunning(true)
        else { setError('Inicie o combate com participantes antes de continuar.'); routeRef.current?.navigate(`/combates/${id}`, { replace: true }) }
      }
    }).catch(() => { if (!cancelled) setError('Não foi possível carregar o combate.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [route?.id])
  useEffect(() => {
    if (!route?.id || !active) return
    if (route.running && (!active.started || !active.participants.some(p => sources.some(c => c.id === p.combatantId)))) {
      setRunning(false)
      setError('Inicie o combate com participantes antes de continuar.')
      route.navigate(`/combates/${route.id}`, { replace: true })
    } else setRunning(route.running)
  }, [route?.running])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (inFlight.current || dirty.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  function open(combat: SavedCombat) { routeRef.current?.setUnsafe(false); latest.current = combat; confirmed.current = combat; blocked.current = false; dirty.current = false; setFormGeneration(value => value + 1); setActive(combat); setStatus('Alterações salvas'); setError(''); setRunning(false) }
  async function flush() {
    if (inFlight.current || blocked.current || !dirty.current || !latest.current || !confirmed.current) return
    inFlight.current = true; dirty.current = false; route?.setUnsafe(true); setStatus('Salvando…')
    const snapshot = { ...latest.current, version: confirmed.current.version }
    try {
      const saved = await combatsService.update(snapshot)
      confirmed.current = saved
      if (latest.current) { latest.current = { ...latest.current, version: saved.version }; setActive(latest.current) }
      if (!dirty.current) setStatus('Alterações salvas')
    } catch (reason) {
      blocked.current = true; dirty.current = true
      setRunning(false)
      setSelecting(false)
      setEditing(null)
      if (route?.id) route.navigate(`/combates/${route.id}`, { replace: true })
      setStatus('Não salvo')
      setError(reason instanceof CombatConflict ? 'Este combate foi alterado em outra sessão. Carregue a versão mais recente.' : 'Não foi possível salvar as alterações. Tente novamente ou carregue a versão salva.')
    } finally { inFlight.current = false; if (dirty.current && !blocked.current) void flush(); else route?.setUnsafe(dirty.current || blocked.current) }
  }
  function change(update: (current: SavedCombat) => SavedCombat) {
    if (!latest.current || blocked.current || missingSources) return
    const next = update(latest.current); latest.current = next; setActive(next); dirty.current = true; void flush()
  }
  async function reload() {
    if (!latest.current) return
    try { const [combat, combatants] = await Promise.all([combatsService.get(latest.current.id), combatantsService.list()]); setSources(combatants); open(combat) }
    catch { setError('Não foi possível carregar a versão salva.') }
  }
  async function create(event: FormEvent) {
    event.preventDefault(); if (!title.trim() || pending) return
    setPending(true); setError('')
    try {
      const combat = await combatsService.create(title.trim(), description.trim() || null)
      setCreating(false)
      setTitle('')
      setDescription('')
      if (route) route.navigate(`/combates/${combat.id}`)
      else open(combat)
    }
    catch { setError('Não foi possível criar o combate.') } finally { setPending(false) }
  }
  async function remove() {
    if (!deleting || pending) return
    setPending(true)
    try { await combatsService.remove(deleting.id); setItems(current => current.filter(item => item.id !== deleting.id)); setDeleting(null) }
    catch { setError('Não foi possível excluir o combate.') } finally { setPending(false) }
  }
  function leave() { if (inFlight.current || dirty.current) { setError('Aguarde o salvamento ou resolva a falha antes de sair.'); return }; setActive(null); setRunning(false); if (route) route.navigate('/combates'); else setListRevision(value => value + 1) }
  const sourceById = new Map(sources.map(item => [item.id, item]))
  const missingSources = Boolean(active?.participants.some(p => !sourceById.has(p.combatantId)))
  const combatants = active ? active.participants.flatMap(p => { const source = sourceById.get(p.combatantId); if (!source) return []; const same = active.participants.filter(entry => entry.combatantId === p.combatantId); const item = toCombatant(p, source); return [{ ...item, name: same.length > 1 ? `${item.name} ${same.findIndex(entry => entry.id === p.id) + 1}` : item.name }] }) : []
  const ordered = orderCombatants(combatants)
  function addSelected() {
    const participants: Participant[] = selectedCombatantIds.flatMap(id => {
      const source = sourceById.get(id)
      return source ? [{ id: participantId(), combatantId: source.id, currentHitPoints: source.maximumHitPoints, additionalHitPoints: null, initiative: null, naturalInitiative: null, conditions: [] }] : []
    })
    if (!participants.length) return
    change(current => ({ ...current, participants: [...current.participants, ...participants], currentParticipantId: current.started && current.currentParticipantId === null ? participants[0].id : current.currentParticipantId }))
    setSelectedCombatantIds([])
    setSelecting(false)
  }
  function removeParticipant(id: number) {
    const index = ordered.findIndex(p => Number(p.id) === id)
    const next = ordered.length > 1 ? ordered[(index + 1) % ordered.length] : null
    change(current => ({ ...current, currentParticipantId: current.currentParticipantId === id ? (next ? Number(next.id) : null) : current.currentParticipantId, participants: current.participants.filter(p => p.id !== id) }))
  }
  function editParticipant(input: CombatantInput) {
    if (!editing) return
    change(current => ({ ...current, participants: current.participants.map(p => String(p.id) === editing.id ? { ...p, currentHitPoints: input.currentHitPoints, additionalHitPoints: input.additionalHitPoints, initiative: input.initiative, naturalInitiative: input.naturalInitiative ?? null, conditions: input.conditions } : p) }))
    setEditing(null)
  }
  if (active && running && combatants.length && !missingSources) return <CombatScreen combatants={combatants} initialCombatantId={active.currentParticipantId === null ? null : String(active.currentParticipantId)} onExit={() => { setRunning(false); if (route && active) route.navigate(`/combates/${active.id}`) }} saveStatus={status} onCurrentCombatantChange={id => change(current => ({ ...current, currentParticipantId: Number(id) }))} onCombatantsChange={updated => change(current => ({ ...current, participants: current.participants.map(p => { const item = updated.find(c => c.id === String(p.id)); return item ? { ...p, currentHitPoints: item.currentHitPoints, additionalHitPoints: item.additionalHitPoints, initiative: item.initiative, naturalInitiative: item.naturalInitiative ?? null, conditions: item.conditions } : p }) }))} />
  return <main className="min-h-screen bg-[#160f0a] px-5 py-10 text-[#f5e4ba]"><div className="mx-auto max-w-5xl">
    <button className={button} onClick={active ? leave : route?.id ? () => route.navigate('/combates') : onBack}>← {active || route?.id ? 'Meus combates' : 'Home'}</button>
    {error && <div role="alert" className="mt-4 text-[#ffaaa1]">{error} {active && blocked.current && <><button className={button} onClick={() => { blocked.current = false; setError(''); void flush() }}>Tentar novamente</button> <button className={button} onClick={() => void reload()}>Carregar versão salva</button></>}</div>}
    {missingSources && <div role="alert" className="mt-4 text-[#ffaaa1]">Uma ficha deste combate deixou de estar disponível. <button className={button} onClick={() => void reload()}>Carregar versão atual</button></div>}
    {route?.id && !active ? <p>{loading ? 'Carregando combate…' : 'Volte para a lista de combates.'}</p> : !active ? <><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl text-[#f2d184]">Meus combates</h1><p className="mt-2 text-[#cbb995]">Seus encontros para novas aventuras.</p></div><button className={primary} onClick={event => { dialogTrigger.current = event.currentTarget; setCreating(true) }}>+ Criar combate</button></div>
      {loading ? <p>Carregando combates…</p> : items.length === 0 ? <p className="mt-8">Você ainda não tem combates.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="border border-[#806037] bg-[#2a1d13] p-5"><p className="text-xs text-[#d7af66]">{item.started ? 'Em andamento' : 'Em preparação'}</p><h2 className="text-xl text-[#f2d184]">{item.title}</h2><p>{item.description}</p><p>{item.participants.length} combatentes</p><div className="mt-4 flex flex-wrap gap-2"><button className={primary} onClick={() => { open(item); route?.navigate(`/combates/${item.id}`) }}>Abrir</button><button className={button} onClick={event => { dialogTrigger.current = event.currentTarget; setDeleting(item) }}>Excluir</button></div></article>)}</div>}
      {creating && <ConditionDialog title="Criar combate" returnFocusTo={dialogTrigger.current} onClose={() => setCreating(false)}><form onSubmit={create} className="grid w-full max-w-lg gap-4"><label>Título *<input autoFocus className={field} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255} /></label><label>Descrição<textarea className={field} value={description} onChange={e => setDescription(e.target.value)} maxLength={4000} /></label><div className="flex gap-2"><button className={button} type="button" onClick={() => setCreating(false)}>Cancelar</button><button className={primary} disabled={pending || !title.trim()}>Salvar combate</button></div></form></ConditionDialog>}
      {deleting && <ConditionDialog title={`Excluir ${deleting.title}?`} returnFocusTo={dialogTrigger.current} onClose={() => setDeleting(null)}><p>O combate e seus dados serão excluídos.</p><div className="mt-4 flex gap-2"><button className={button} onClick={() => setDeleting(null)}>Cancelar</button><button className={button} disabled={pending} onClick={() => void remove()}>Confirmar exclusão</button></div></ConditionDialog>}
    </> : <fieldset disabled={missingSources || blocked.current} className="min-w-0"><div className="mt-8 flex flex-wrap justify-between gap-3"><h1 className="text-3xl text-[#f2d184]">Preparar combate</h1><span role="status">{status}</span></div><label className="mt-4 block">Título *<input key={`title-${formGeneration}`} className={field} defaultValue={active.title} maxLength={255} onChange={e => { const value = e.target.value; if (value.trim()) { setError(''); change(current => ({ ...current, title: value })) } else setError('O título é obrigatório.') }} onBlur={e => { if (!e.target.value.trim()) e.target.value = latest.current?.title ?? '' }} /></label><label className="mt-4 block">Descrição<textarea key={`description-${formGeneration}`} className={field} defaultValue={active.description ?? ''} maxLength={4000} onChange={e => { const value = e.target.value; change(current => ({ ...current, description: value || null })) }} /></label><div className="mt-6 flex flex-wrap gap-2"><button className={button} onClick={event => { dialogTrigger.current = event.currentTarget; setSelectedCombatantIds([]); setSelecting(true) }}>+ Adicionar combatente</button><button className={primary} disabled={!ordered.length || blocked.current || missingSources} onClick={() => { if (!active.started) change(current => ({ ...current, started: true, currentParticipantId: Number(ordered[0].id) })); setRunning(true); route?.navigate(`/combates/${active.id}/combate`) }}>{active.started ? 'Retomar combate' : 'Iniciar combate'}</button></div>
      <div className="mt-6 grid gap-3">{ordered.map(item => <article key={item.id} className={`flex items-center gap-4 border bg-[#1e150e] p-4 ${item.type === 'player' ? 'border-[#82bde8]' : 'border-[#d57d68]'}`}><CharacterSprite characterId={item.characterId} label={`Personagem de ${item.name}`} size={96} /><div><h2 className="text-2xl">{item.name}</h2><p>{item.type === 'player' ? 'Jogador' : 'NPC'}</p><p><CombatIcon name="heart" /> PV: {item.currentHitPoints} / {item.maximumHitPoints}{item.additionalHitPoints ? ` - ${item.additionalHitPoints}` : ''}</p><p><CombatIcon name="shield" /> CA: {item.armorClass}</p><p><CombatIcon name="thunder" /> Iniciativa: {item.initiative ?? '—'}</p><ConditionList conditionIds={item.conditions} /><div className="mt-3 flex gap-2"><button className={button} onClick={event => { dialogTrigger.current = event.currentTarget; setEditing(item) }}>Editar</button><button className={button} onClick={() => removeParticipant(Number(item.id))}>Remover</button></div></div></article>)}</div>
      {selecting && <ConditionDialog title="Adicionar combatente" returnFocusTo={dialogTrigger.current} onClose={() => setSelecting(false)}>{sources.length ? <div className="grid gap-3 sm:grid-cols-2">{sources.map(source => <button key={source.id} type="button" aria-label={`Selecionar ${source.name} · PV ${source.maximumHitPoints} · CA ${source.armorClass} · ${sheetOwnerLabel(source)}`} aria-pressed={selectedCombatantIds.includes(source.id)} className={`flex w-full cursor-pointer items-center gap-3 border bg-[#2a1d13] p-4 text-left text-[#f5e4ba] hover:bg-[#49331e] focus-visible:outline-3 focus-visible:outline-[#f8df9d] ${selectedCombatantIds.includes(source.id) ? "ring-2 ring-[#f3d38a] bg-[#49331e]" : ""} ${source.type === 'player' ? 'border-[#82bde8]' : 'border-[#d57d68]'}`} onClick={() => setSelectedCombatantIds(ids => ids.includes(source.id) ? ids.filter(id => id !== source.id) : [...ids, source.id])}><CharacterSprite characterId={source.characterId} label={`Personagem de ${source.name}`} size={72} /><span className="min-w-0"><strong className="block break-words text-xl text-[#f2d184]">{source.name} {selectedCombatantIds.includes(source.id) && <span aria-hidden="true">✓</span>}</strong><span className="block text-sm text-[#d6c4a2]">{source.type === 'player' ? 'Jogador' : 'NPC'} · {sheetOwnerLabel(source)}</span><span className="mt-1 block text-sm text-[#f08a8a]"><CombatIcon name="heart" /> PV: {source.maximumHitPoints}</span><span className="mt-1 block text-sm text-[#94bce9]"><CombatIcon name="shield" /> CA: {source.armorClass}</span></span></button>)}</div> : <p>Crie uma ficha de combatente antes de adicioná-la.</p>}<p className="mt-4 text-sm" role="status">{selectedCombatantIds.length} {selectedCombatantIds.length === 1 ? "combatente selecionado" : "combatentes selecionados"}</p><div className="mt-4 flex flex-wrap gap-2"><button className={button} onClick={() => setSelecting(false)}>Cancelar</button><button className={primary} type="button" disabled={!selectedCombatantIds.length || blocked.current} onClick={addSelected}>Adicionar selecionados</button></div></ConditionDialog>}
      {editing && <CombatantFormDialog combatant={editing} temporaryOnly returnFocusTo={dialogTrigger.current} onClose={() => setEditing(null)} onSave={editParticipant} />}
    </fieldset>}
  </div></main>
}

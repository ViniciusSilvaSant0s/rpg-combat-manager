import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ConditionDialog } from '../components/ConditionPickerDialog'
import { useCombatants } from '../combatantsContext'
import { friendshipsService, type FriendProfile, type Friendships, type FriendshipAction } from '../services/friendships'

const button = 'min-h-11 cursor-pointer border border-[#a87939] bg-[#49331e] px-4 py-2 font-bold hover:bg-[#604528] focus-visible:outline-3 focus-visible:outline-[#f8df9d] disabled:opacity-50'
const groups = [
  { key: 'friends', title: 'Meus amigos', empty: 'Você ainda não tem amigos.' },
  { key: 'received', title: 'Solicitações recebidas', empty: 'Nenhuma solicitação recebida.' },
  { key: 'sent', title: 'Solicitações enviadas', empty: 'Nenhuma solicitação enviada.' },
] as const

export default function FriendsScreen({ onBack }: { onBack: () => void }) {
  const { setItems } = useCombatants()
  const [list, setList] = useState<Friendships | null>(null)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')
  const [result, setResult] = useState<FriendProfile | null>()
  const [removing, setRemoving] = useState<FriendProfile | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  useEffect(() => {
    let active = true
    setLoading(true)
    friendshipsService.list().then(data => { if (active) setList(data) })
      .catch(() => { if (active) setError('Não foi possível carregar as amizades.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function search(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setResult(undefined)
    try { setResult(await friendshipsService.search(nickname.trim())) }
    catch { setError('Não foi possível buscar o perfil. Tente novamente.') }
    finally { setBusy(false) }
  }

  async function change(action: FriendshipAction, person: FriendProfile) {
    setBusy(true)
    setError('')
    try {
      await friendshipsService.change(action, person.id)
      setResult(undefined)
      setRemoving(null)
      setItems(null)
      setList(null)
      setRevision(current => current + 1)
    } catch (reason) {
      setRemoving(null)
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a amizade.')
    } finally { setBusy(false) }
  }

  const known = result && groups.find(group => list?.[group.key].some(person => person.id === result.id))
  return <main className="min-h-screen bg-[#160f0a] px-5 py-10 text-[#f5e4ba]"><div className="mx-auto max-w-4xl">
    <button className={button} onClick={onBack}>← Home</button>
    <h1 className="my-8 text-3xl text-[#f2d184]">Amigos</h1>
    <form className="flex flex-wrap items-end gap-3" onSubmit={search}>
      <label className="grid gap-1">Nickname completo<input className="min-h-11 border border-[#8a6a38] bg-[#100c09] px-3" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" title="De 3 a 20 letras, números ou sublinhados." disabled={busy} value={nickname} onChange={e => { setNickname(e.target.value); setResult(undefined) }} /></label>
      <button className={button} disabled={busy || !nickname.trim()}>Buscar</button>
    </form>
    {result === null && <p role="status" className="mt-3">Nenhum perfil encontrado.</p>}
    {result && <div className="mt-3 flex flex-wrap items-center gap-3"><strong>{result.nickname}</strong>
      {known ? <span>{ { friends: 'Vocês já são amigos.', sent: 'Solicitação enviada.', received: 'Solicitação recebida.' }[known.key]}</span> :
        <button className={button} disabled={busy || loading || !list} onClick={() => void change('request', result)}>Enviar solicitação</button>}
    </div>}
    {error && <p className="mt-4 text-[#ffaaa1]" role="alert">{error}</p>}
    <button className={button + ' mt-6'} disabled={loading || busy} onClick={() => { setError(''); setRevision(value => value + 1) }}>Atualizar lista</button>
    {loading && <p role="status">Carregando amizades…</p>}
    {list && groups.map(group => <section key={group.key} aria-label={group.title} className="mt-6 border border-[#806037] bg-[#2a1d13] p-5">
      <h2 className="text-xl text-[#f2d184]">{group.title}</h2>
      {!list[group.key].length && <p className="mt-3">{group.empty}</p>}
      <ul>{list[group.key].map(person => <li key={person.id} className="mt-3 flex flex-wrap items-center gap-2"><strong className="mr-auto">{person.nickname}</strong>
        {group.key === 'friends' && <button className={button} disabled={busy || loading} onClick={event => { trigger.current = event.currentTarget; setRemoving(person) }}>Desfazer amizade</button>}
        {group.key === 'received' && <><button className={button} disabled={busy || loading} onClick={() => void change('accept', person)}>Aceitar</button><button className={button} disabled={busy || loading} onClick={() => void change('decline', person)}>Recusar</button></>}
        {group.key === 'sent' && <button className={button} disabled={busy || loading} onClick={() => void change('cancel', person)}>Cancelar solicitação</button>}
      </li>)}</ul>
    </section>)}
    {removing && <ConditionDialog title={'Desfazer amizade com ' + removing.nickname + '?'} returnFocusTo={trigger.current} onClose={() => { if (!busy) setRemoving(null) }}>
      <p>As fichas compartilhadas serão removidas dos combates de ambos. Cada pessoa manterá suas fichas originais.</p>
      <div className="mt-4 flex gap-3"><button className={button} disabled={busy} onClick={() => setRemoving(null)}>Cancelar</button>
      <button className={button} disabled={busy} onClick={() => void change('remove', removing)}>Confirmar</button></div>
    </ConditionDialog>}
  </div></main>
}

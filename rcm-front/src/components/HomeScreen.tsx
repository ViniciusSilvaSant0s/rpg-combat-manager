type Props = { onCombatants: () => void; onProfile: () => void; onSignOut: () => void }
export default function HomeScreen({ onCombatants, onProfile, onSignOut }: Props) {
  return <main className="min-h-screen bg-[#160f0a] px-5 py-10 text-[#f5e4ba]"><div className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#705333] pb-5"><h1 className="font-[family-name:var(--font-display)] text-3xl text-[#f2d184]">RPG Combat Manager</h1><nav className="flex gap-4"><button className="underline" onClick={onProfile}>Meu perfil</button><button className="underline" onClick={onSignOut}>Sair</button></nav></header>
    <h2 className="mt-12 text-3xl">Bem-vindo à sua aventura</h2><p className="mt-2 text-[#cbb995]">Escolha por onde começar.</p>
    <button onClick={onCombatants} className="mt-8 block w-full max-w-sm cursor-pointer border border-[#c79a4e] bg-[#38271a] p-7 text-left hover:bg-[#49331e] focus-visible:outline-3 focus-visible:outline-[#f8df9d]"><span className="text-3xl" aria-hidden="true">⚔</span><strong className="mt-3 block text-2xl text-[#f2d184]">Combatentes</strong><span className="mt-2 block text-[#cbb995]">Crie e gerencie suas fichas.</span></button>
  </div></main>
}

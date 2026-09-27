import heartIcon from '../assets/icons/IconGodotNode/white/icon_heart.png'
import followIcon from '../assets/icons/IconGodotNode/white/icon_follow.png'
import resetIcon from '../assets/icons/IconGodotNode/white/icon_reset_2.png'
import shieldIcon from '../assets/icons/IconGodotNode/white/icon_shield.png'
import swordIcon from '../assets/icons/IconGodotNode/white/icon_sword.png'
import thunderIcon from '../assets/icons/IconGodotNode/white/icon_thunder.png'

type CombatIconName = 'follow' | 'heart' | 'reset' | 'shield' | 'sword' | 'thunder'

const iconSources: Record<CombatIconName, string> = {
  follow: followIcon,
  heart: heartIcon,
  reset: resetIcon,
  shield: shieldIcon,
  sword: swordIcon,
  thunder: thunderIcon,
}

function CombatIcon({ name, mirrored = false }: { name: CombatIconName; mirrored?: boolean }) {
  const iconSource = `url("${iconSources[name]}")`

  return (
    <span
      aria-hidden="true"
      className={`combat-icon ${mirrored ? 'combat-icon--mirrored' : ''}`}
      style={{ maskImage: iconSource, WebkitMaskImage: iconSource }}
    />
  )
}

export default CombatIcon

import { findCharacter } from '../characters'

type CharacterSpriteProps = {
  characterId?: string | null
  label: string
  size?: number
  className?: string
}

function CharacterSprite({ characterId, label, size = 128, className = '' }: CharacterSpriteProps) {
  const character = findCharacter(characterId)
  if (!character) return null

  return (
    <span
      aria-label={label}
      className={`block shrink-0 overflow-hidden ${className}`}
      role="img"
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden="true"
        className="block origin-top-left bg-no-repeat [image-rendering:pixelated]"
        style={{
          width: character.frameSize,
          height: character.frameSize,
          backgroundImage: `url(${character.image})`,
          backgroundPosition: '0 0',
          transform: `scale(${size / character.frameSize})`,
        }}
      />
    </span>
  )
}

export default CharacterSprite

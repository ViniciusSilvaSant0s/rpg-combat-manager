export type Character = {
  id: string
  name: string
  image: string
  frameSize: number
}

const characterImages = import.meta.glob<string>('./assets/characters/Character_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

// Sprite sheets in this folder share 64×64 frames and use the first frame.
export const characters: Character[] = Object.entries(characterImages)
  .flatMap(([path, image]) => {
    const number = path.match(/Character_(\d+)\.png$/)?.[1]
    return number ? [{ id: `character-${number}`, name: `Personagem ${number}`, image, frameSize: 64 }] : []
  })
  .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR', { numeric: true }))

export function findCharacter(id: unknown) {
  return characters.find((character) => character.id === id)
}

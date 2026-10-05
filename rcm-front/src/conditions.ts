import visibilityOff from './assets/icons/IconGodotNode/white/icon_visibility_off.png'
import audio from './assets/icons/IconGodotNode/white/icon_audio.png'
import heart from './assets/icons/IconGodotNode/white/icon_heart.png'
import emote from './assets/icons/IconGodotNode/white/icon_emote.png'
import hand from './assets/icons/IconGodotNode/white/icon_hand.png'
import boots from './assets/icons/IconGodotNode/white/icon_boots.png'
import lock from './assets/icons/IconGodotNode/white/icon_lock.png'
import time from './assets/icons/IconGodotNode/white/icon_time.png'
import disable from './assets/icons/IconGodotNode/white/icon_disable.png'
import freeze from './assets/icons/IconGodotNode/white/icon_freeze.png'
import wall from './assets/icons/IconGodotNode/white/icon_wall.png'
import potion from './assets/icons/IconGodotNode/white/icon_potion.png'
import spiral from './assets/icons/IconGodotNode/white/icon_spiral.png'
import paused from './assets/icons/IconGodotNode/white/icon_paused.png'
import visibility from './assets/icons/IconGodotNode/white/icon_visibility.png'
import move from './assets/icons/IconGodotNode/white/icon_move.png'
import tree from './assets/icons/IconGodotNode/white/icon_tree.png'
import drop from './assets/icons/IconGodotNode/white/icon_drop.png'
import character from './assets/icons/IconGodotNode/white/icon_character.png'
import follow from './assets/icons/IconGodotNode/white/icon_follow.png'
import triangle from './assets/icons/IconGodotNode/white/icon_triangle.png'
import particle from './assets/icons/IconGodotNode/white/icon_particle.png'
import sword from './assets/icons/IconGodotNode/white/icon_sword.png'
import projectile from './assets/icons/IconGodotNode/white/icon_projectile.png'
import unlock from './assets/icons/IconGodotNode/white/icon_unlock.png'
import shield from './assets/icons/IconGodotNode/white/icon_shield.png'
import star from './assets/icons/IconGodotNode/white/icon_star.png'
import key from './assets/icons/IconGodotNode/white/icon_key.png'
import search from './assets/icons/IconGodotNode/white/icon_search.png'
import target from './assets/icons/IconGodotNode/white/icon_target.png'
import glow from './assets/icons/IconGodotNode/white/icon_glow.png'
import lightBulb from './assets/icons/IconGodotNode/white/icon_light_bulb.png'
import colorCorrection from './assets/icons/IconGodotNode/white/icon_color_correction.png'
import areaMeteo from './assets/icons/IconGodotNode/white/icon_area_meteo.png'
import humanController from './assets/icons/IconGodotNode/white/icon_human_controller.png'

export type ConditionId =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified'
  | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious'
  | 'move' | 'climb' | 'swim' | 'drop-prone' | 'crawl' | 'stand-up'
  | 'high-jump' | 'long-jump' | 'movement-improvise' | 'difficult-terrain' | 'grapple-move'
  | 'attack' | 'grapple' | 'shove' | 'action-cast-spell' | 'dash' | 'disengage'
  | 'dodge' | 'escape' | 'help' | 'use-object' | 'use-shield' | 'hide' | 'search'
  | 'ready' | 'action-class-feature' | 'action-improvise'
  | 'offhand-attack' | 'bonus-cast-spell' | 'bonus-class-feature'
  | 'opportunity-attack' | 'readied-action' | 'reaction-cast-spell'
  | 'lightly-obscured' | 'heavily-obscured' | 'bright-light' | 'dim-light' | 'darkness'
  | 'blindsight' | 'darkvision' | 'truesight' | 'half-cover' | 'three-quarters-cover' | 'full-cover'

export const conditionCategories = {
  sensory: { name: 'Sensorial', color: '#94bce9' },
  mental: { name: 'Mental', color: '#c4a1ef' },
  movement: { name: 'Movimento', color: '#e8ad66' },
  debilitation: { name: 'Debilitação', color: '#f08a8a' },
  invisibility: { name: 'Invisibilidade', color: '#91c998' },
  actions: { name: 'Ações', color: '#e3be73' },
  bonusActions: { name: 'Ações bônus', color: '#6fd6b8' },
  reactions: { name: 'Reações', color: '#df99c2' },
  obscurance: { name: 'Obscurecimento', color: '#9aa9bd' },
  light: { name: 'Iluminação', color: '#f4d876' },
  vision: { name: 'Sentidos especiais', color: '#70c9dc' },
  cover: { name: 'Cobertura', color: '#a0c67b' },
} as const

export const conditionGroups = {
  states: 'Estados',
  movement: 'Movimento',
  actions: 'Ações',
  bonusActions: 'Ações bônus',
  reactions: 'Reações',
  obscurance: 'Obscurecimento',
  light: 'Iluminação',
  vision: 'Sentidos especiais',
  cover: 'Cobertura',
} as const

export type ConditionDefinition = {
  id: ConditionId
  name: string
  description: string
  category: keyof typeof conditionCategories
  group: keyof typeof conditionGroups
  icon: string
}

// Resumos em português de todas as entradas da referência (regras de 2014):
// https://crobi.github.io/dnd5e-quickref/preview/quickref.html
// Os identificadores dos 15 estados originais permanecem compatíveis com os dados salvos.
// Todas as opções são marcações informativas; seus efeitos não são automatizados.
export const conditions: readonly ConditionDefinition[] = [
  { id: 'blinded', name: 'Cego / Blinded', category: 'sensory', group: 'states', icon: visibilityOff,
    description: 'Você não consegue enxergar e falha em testes que exigem visão. Seus ataques têm desvantagem; ataques contra você têm vantagem.' },
  { id: 'charmed', name: 'Enfeitiçado / Charmed', category: 'mental', group: 'states', icon: heart,
    description: 'Você não pode atacar nem prejudicar quem o enfeitiçou. Essa criatura tem vantagem em testes de interação social com você.' },
  { id: 'deafened', name: 'Surdo / Deafened', category: 'sensory', group: 'states', icon: audio,
    description: 'Você não consegue ouvir e falha automaticamente em testes que dependem da audição.' },
  { id: 'exhaustion', name: 'Exaustão / Exhaustion', category: 'debilitation', group: 'states', icon: time,
    description: 'Possui seis níveis cumulativos: desvantagem em testes; deslocamento pela metade; desvantagem em ataques e salvaguardas; PV máximos pela metade; deslocamento zero; morte. Descanso longo com comida e bebida reduz um nível.' },
  { id: 'frightened', name: 'Amedrontado / Frightened', category: 'mental', group: 'states', icon: emote,
    description: 'Enquanto a fonte do medo estiver visível, seus ataques e testes têm desvantagem. Você não pode se aproximar dela voluntariamente.' },
  { id: 'grappled', name: 'Agarrado / Grappled', category: 'movement', group: 'states', icon: hand,
    description: 'Seu deslocamento é zero. O efeito termina se quem o agarra ficar incapacitado ou se você sair do alcance dessa criatura.' },
  { id: 'incapacitated', name: 'Incapacitado / Incapacitated', category: 'debilitation', group: 'states', icon: disable,
    description: 'Você não pode realizar ações nem reações.' },
  { id: 'invisible', name: 'Invisível / Invisible', category: 'invisibility', group: 'states', icon: visibility,
    description: 'Você não pode ser visto sem magia ou sentidos especiais, mas ruídos e rastros podem denunciá-lo. Seus ataques têm vantagem; ataques contra você têm desvantagem.' },
  { id: 'paralyzed', name: 'Paralisado / Paralyzed', category: 'debilitation', group: 'states', icon: freeze,
    description: 'Você está incapacitado, não se move nem fala e falha em salvaguardas de Força e Destreza. Ataques contra você têm vantagem; acertos a até 1,5 m são críticos.' },
  { id: 'petrified', name: 'Petrificado / Petrified', category: 'debilitation', group: 'states', icon: wall,
    description: 'Você se torna matéria sólida e fica incapacitado, imóvel e alheio ao redor. Tem resistência a todo dano e imunidade a veneno e doença; ataques contra você têm vantagem.' },
  { id: 'poisoned', name: 'Envenenado / Poisoned', category: 'debilitation', group: 'states', icon: potion,
    description: 'Seus ataques e testes de habilidade têm desvantagem.' },
  { id: 'prone', name: 'Caído / Prone', category: 'movement', group: 'states', icon: boots,
    description: 'Você só pode rastejar até se levantar. Seus ataques têm desvantagem. Ataques contra você têm vantagem a até 1,5 m e desvantagem além dessa distância.' },
  { id: 'restrained', name: 'Contido / Restrained', category: 'movement', group: 'states', icon: lock,
    description: 'Seu deslocamento é zero. Seus ataques e salvaguardas de Destreza têm desvantagem; ataques contra você têm vantagem.' },
  { id: 'stunned', name: 'Atordoado / Stunned', category: 'debilitation', group: 'states', icon: spiral,
    description: 'Você está incapacitado, não se move e fala com dificuldade. Falha em salvaguardas de Força e Destreza; ataques contra você têm vantagem.' },
  { id: 'unconscious', name: 'Inconsciente / Unconscious', category: 'debilitation', group: 'states', icon: paused,
    description: 'Você está incapacitado, não se move nem fala, cai e solta o que segura. Falha em salvaguardas de Força e Destreza. Ataques contra você têm vantagem; acertos a até 1,5 m são críticos.' },

  { id: 'move', name: 'Mover-se / Move', category: 'movement', group: 'movement', icon: move,
    description: 'Gaste 1,5 m de deslocamento para percorrer 1,5 m. Você pode dividir o movimento entre ações, respeitando seu deslocamento disponível.' },
  { id: 'climb', name: 'Escalar / Climb', category: 'movement', group: 'movement', icon: tree,
    description: 'Sem deslocamento de escalada, cada 1,5 m escalado custa 3 m de movimento. Escaladas difíceis podem exigir um teste de Força (Atletismo).' },
  { id: 'swim', name: 'Nadar / Swim', category: 'movement', group: 'movement', icon: drop,
    description: 'Sem deslocamento de natação, cada 1,5 m nadado custa 3 m de movimento. Águas difíceis podem exigir um teste de Força (Atletismo).' },
  { id: 'drop-prone', name: 'Deitar-se / Drop prone', category: 'movement', group: 'movement', icon: boots,
    description: 'Deite-se sem gastar deslocamento e assuma o estado Caído. Para se mover assim, você precisa rastejar ou usar magia.' },
  { id: 'crawl', name: 'Rastejar / Crawl', category: 'movement', group: 'movement', icon: character,
    description: 'Cada 1,5 m percorrido rastejando custa 3 m de deslocamento.' },
  { id: 'stand-up', name: 'Levantar-se / Stand up', category: 'movement', group: 'movement', icon: follow,
    description: 'Levantar-se custa metade do seu deslocamento. Você não pode se levantar com deslocamento zero ou movimento restante insuficiente.' },
  { id: 'high-jump', name: 'Salto em altura / High jump', category: 'movement', group: 'movement', icon: triangle,
    description: 'Com 3 m de corrida, salte uma altura em pés igual a 3 + seu modificador de Força. Sem corrida, alcance metade dessa altura. O salto consome movimento.' },
  { id: 'long-jump', name: 'Salto em distância / Long jump', category: 'movement', group: 'movement', icon: projectile,
    description: 'Com 3 m de corrida, salte uma distância em pés até seu valor de Força. Sem corrida, alcance metade dessa distância. O salto consome movimento.' },
  { id: 'movement-improvise', name: 'Improvisar / Improvise', category: 'movement', group: 'movement', icon: particle,
    description: 'Proponha um movimento ou uma acrobacia fora da lista. O mestre decide se é possível e quais testes são necessários.' },
  { id: 'difficult-terrain', name: 'Terreno difícil / Difficult terrain', category: 'movement', group: 'movement', icon: wall,
    description: 'Cada 1,5 m percorrido em terreno difícil custa 1,5 m adicional de deslocamento.' },
  { id: 'grapple-move', name: 'Mover criatura agarrada / Grapple move', category: 'movement', group: 'movement', icon: hand,
    description: 'Arraste ou carregue a criatura agarrada. Seu deslocamento cai pela metade, salvo se ela for pelo menos duas categorias de tamanho menor que você.' },

  { id: 'attack', name: 'Atacar / Attack', category: 'actions', group: 'actions', icon: sword,
    description: 'Realize um ataque corpo a corpo ou à distância. Características como Ataque Extra permitem vários ataques; um ataque corpo a corpo pode ser substituído por agarrar ou empurrar.' },
  { id: 'grapple', name: 'Agarrar / Grapple', category: 'actions', group: 'actions', icon: hand,
    description: 'Substitua um ataque por uma tentativa de agarrar com uma mão livre. Dispute seu Atletismo contra Atletismo ou Acrobacia do alvo, que deve estar ao alcance e ter no máximo um tamanho acima do seu.' },
  { id: 'shove', name: 'Empurrar / Shove', category: 'actions', group: 'actions', icon: move,
    description: 'Substitua um ataque por um teste de Atletismo contra Atletismo ou Acrobacia do alvo. Se vencer, derrube-o ou empurre-o 1,5 m. O alvo deve estar ao alcance e ter no máximo um tamanho acima do seu.' },
  { id: 'action-cast-spell', name: 'Conjurar magia / Cast a spell', category: 'actions', group: 'actions', icon: spiral,
    description: 'Conjure uma magia cujo tempo de conjuração seja uma ação. Respeite alcance, componentes e concentração. Após conjurar uma magia como ação bônus, só pode conjurar um truque com tempo de uma ação no mesmo turno.' },
  { id: 'dash', name: 'Disparada / Dash', category: 'actions', group: 'actions', icon: boots,
    description: 'Ganhe movimento adicional neste turno igual ao seu deslocamento, após aplicar os modificadores.' },
  { id: 'disengage', name: 'Desengajar / Disengage', category: 'actions', group: 'actions', icon: unlock,
    description: 'Seu movimento não provoca ataques de oportunidade pelo restante deste turno.' },
  { id: 'dodge', name: 'Esquivar / Dodge', category: 'actions', group: 'actions', icon: shield,
    description: 'Até seu próximo turno, ataques de criaturas que você vê têm desvantagem contra você, e suas salvaguardas de Destreza têm vantagem. O benefício termina se você ficar incapacitado ou com deslocamento zero.' },
  { id: 'escape', name: 'Escapar / Escape', category: 'actions', group: 'actions', icon: unlock,
    description: 'Use Atletismo ou Acrobacia contra o Atletismo de quem o agarra para escapar. Outras restrições podem exigir testes específicos de Força ou Destreza.' },
  { id: 'help', name: 'Ajudar / Help', category: 'actions', group: 'actions', icon: heart,
    description: 'Dê vantagem ao próximo teste de um aliado na tarefa ajudada, ou ao próximo ataque dele contra uma criatura a até 1,5 m de você. O benefício dura até seu próximo turno.' },
  { id: 'use-object', name: 'Usar objeto / Use Object', category: 'actions', group: 'actions', icon: key,
    description: 'Interaja com um segundo objeto neste turno ou use um objeto que exija uma ação. Uma interação simples com um objeto normalmente é gratuita.' },
  { id: 'use-shield', name: 'Usar escudo / Use shield', category: 'actions', group: 'actions', icon: shield,
    description: 'Gaste uma ação para equipar ou remover um escudo.' },
  { id: 'hide', name: 'Esconder-se / Hide', category: 'actions', group: 'actions', icon: visibilityOff,
    description: 'Tente se ocultar usando Destreza (Furtividade), confrontada pela Percepção dos observadores. Você precisa evitar a visão deles; ruídos podem revelar sua posição.' },
  { id: 'search', name: 'Procurar / Search', category: 'actions', group: 'actions', icon: search,
    description: 'Dedique sua atenção a encontrar algo. O mestre pode pedir Sabedoria (Percepção) ou Inteligência (Investigação).' },
  { id: 'ready', name: 'Preparar / Ready', category: 'actions', group: 'actions', icon: time,
    description: 'Escolha um gatilho perceptível e uma ação ou movimento para executar como reação. Uma magia preparada exige concentração e tempo de conjuração de uma ação.' },
  { id: 'action-class-feature', name: 'Usar característica de classe / Use class feature', category: 'actions', group: 'actions', icon: star,
    description: 'Use uma característica racial ou de classe que consuma uma ação, conforme suas regras específicas.' },
  { id: 'action-improvise', name: 'Improvisar / Improvise', category: 'actions', group: 'actions', icon: particle,
    description: 'Proponha uma ação fora da lista. O mestre decide se é possível e quais testes determinam o resultado.' },

  { id: 'offhand-attack', name: 'Ataque com a outra mão / Offhand Attack', category: 'bonusActions', group: 'bonusActions', icon: sword,
    description: 'Após atacar com uma arma leve corpo a corpo, use uma ação bônus para atacar com outra arma leve na outra mão. Não acrescente o modificador de habilidade ao dano, a menos que seja negativo.' },
  { id: 'bonus-cast-spell', name: 'Conjurar magia / Cast a spell', category: 'bonusActions', group: 'bonusActions', icon: spiral,
    description: 'Conjure uma magia cujo tempo de conjuração seja uma ação bônus. No mesmo turno, outras magias só podem ser truques com tempo de conjuração de uma ação.' },
  { id: 'bonus-class-feature', name: 'Usar característica de classe / Use class feature', category: 'bonusActions', group: 'bonusActions', icon: star,
    description: 'Use uma característica racial ou de classe que consuma uma ação bônus, conforme suas regras específicas.' },

  { id: 'opportunity-attack', name: 'Ataque de oportunidade / Opportunity attack', category: 'reactions', group: 'reactions', icon: sword,
    description: 'Quando um inimigo sai do seu alcance, use sua reação para um ataque corpo a corpo antes que ele saia. Teleporte e movimento forçado sem uso do movimento, ação ou reação do alvo não provocam esse ataque.' },
  { id: 'readied-action', name: 'Ação preparada / Readied action', category: 'reactions', group: 'reactions', icon: time,
    description: 'Quando o gatilho escolhido na ação Preparar ocorrer, use sua reação para executar a resposta preparada ou ignore o gatilho.' },
  { id: 'reaction-cast-spell', name: 'Conjurar magia / Cast a spell', category: 'reactions', group: 'reactions', icon: spiral,
    description: 'Conjure uma magia cujo tempo de conjuração seja uma reação, quando ocorrer o gatilho indicado pela própria magia.' },

  { id: 'lightly-obscured', name: 'Levemente obscurecido / Lightly obscured', category: 'obscurance', group: 'obscurance', icon: areaMeteo,
    description: 'Penumbra, névoa leve ou vegetação moderada causam desvantagem em testes de Sabedoria (Percepção) que dependem da visão.' },
  { id: 'heavily-obscured', name: 'Fortemente obscurecido / Heavily obscured', category: 'obscurance', group: 'obscurance', icon: visibilityOff,
    description: 'Escuridão, névoa opaca ou vegetação densa bloqueiam a visão. A criatura sofre os efeitos de Cego ao tentar enxergar nessa área.' },
  { id: 'bright-light', name: 'Luz plena / Bright light', category: 'light', group: 'light', icon: glow,
    description: 'A iluminação permite que a maioria das criaturas enxergue normalmente. Inclui luz do dia e áreas iluminadas por tochas, lanternas ou fogo.' },
  { id: 'dim-light', name: 'Penumbra / Dim light', category: 'light', group: 'light', icon: lightBulb,
    description: 'A luz fraca cria uma área levemente obscurecida, causando desvantagem em testes de Percepção baseados na visão.' },
  { id: 'darkness', name: 'Escuridão / Darkness', category: 'light', group: 'light', icon: colorCorrection,
    description: 'A ausência de luz cria uma área fortemente obscurecida. Pode ocorrer à noite, em locais subterrâneos sem iluminação ou por magia.' },
  { id: 'blindsight', name: 'Percepção às cegas / Blindsight', category: 'vision', group: 'vision', icon: humanController,
    description: 'Perceba o ambiente sem depender da visão, dentro do alcance desse sentido especial.' },
  { id: 'darkvision', name: 'Visão no escuro / Darkvision', category: 'vision', group: 'vision', icon: visibility,
    description: 'Dentro do alcance, enxergue a escuridão como penumbra. Na escuridão, você distingue apenas tons de cinza, sem cores.' },
  { id: 'truesight', name: 'Visão verdadeira / Truesight', category: 'vision', group: 'vision', icon: target,
    description: 'Dentro do alcance, enxergue na escuridão comum e mágica, perceba seres invisíveis, ilusões e formas verdadeiras, além do Plano Etéreo.' },
  { id: 'half-cover', name: 'Meia cobertura / Half cover', category: 'cover', group: 'cover', icon: shield,
    description: 'Um obstáculo protege pelo menos metade do corpo, concedendo +2 na CA e nas salvaguardas de Destreza. Entre várias coberturas, use apenas a mais protetora.' },
  { id: 'three-quarters-cover', name: 'Cobertura de três quartos / Three-quarters cover', category: 'cover', group: 'cover', icon: wall,
    description: 'Um obstáculo protege cerca de três quartos do corpo, concedendo +5 na CA e nas salvaguardas de Destreza. Entre várias coberturas, use apenas a mais protetora.' },
  { id: 'full-cover', name: 'Cobertura total / Full cover', category: 'cover', group: 'cover', icon: shield,
    description: 'Um obstáculo encobre completamente o alvo, impedindo ataques e magias direcionados a ele. Alguns efeitos de área ainda podem alcançá-lo.' },
]

export function findCondition(id: string): ConditionDefinition | undefined {
  return conditions.find((condition) => condition.id === id)
}

export function normalizeConditions(value: unknown): ConditionId[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is ConditionId => (
    typeof id === 'string' && findCondition(id) !== undefined
  )))]
}

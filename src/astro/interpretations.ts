import type { SignKey } from './signs'
import type { PointKey } from './types'

/**
 * Furby-specific interpretation copy. Every line is written about a toy's
 * behaviour, never about a person. `{name}` is replaced with the Furby's name.
 */

export const BIG_THREE_TAGLINES = {
  sun: 'The Furby within',
  moon: 'The Furby when nobody is watching',
  rising: 'The Furby the world meets',
} as const

export const POINT_HEADLINES: Record<PointKey, string> = {
  sun: 'Who {name} is underneath the fur.',
  moon: 'What {name} does when nobody is watching.',
  ascendant: 'The {name} the world meets first.',
  mercury: 'How {name} communicates with humans.',
  venus: 'How {name} demands affection.',
  mars: 'How {name} behaves when displeased.',
  jupiter: 'Where {name} becomes excessive.',
  saturn: 'The lessons {name} would prefer not to learn.',
  uranus: 'Where {name} malfunctions on purpose.',
  neptune: 'What {name} dreams about in sleep mode.',
  pluto: 'What {name} will never, ever let go of.',
  northNode: 'What {name} was born to figure out.',
  midheaven: 'What {name} wants to be known for.',
  descendant: 'The kind of human {name} keeps.',
  imumCoeli: 'Where {name} feels most at home.',
}

type SignCopy = Record<SignKey, string>

const sun: SignCopy = {
  aries: '{name} wakes up already mid-argument. First to chirp, first to headbutt, first to forgive.',
  taurus: '{name} is a slow, warm, immovable lump who will not be hurried through a snack.',
  gemini: '{name} has two moods and swaps them mid-sentence, usually while talking to itself.',
  cancer: '{name} remembers every time it was put down and every time it was picked back up.',
  leo: '{name} is convinced it is the main character of the household. It is probably right.',
  virgo: '{name} notices when its fur is brushed the wrong way and quietly holds a grudge about it.',
  libra: '{name} wants everyone in the room to be happy and will sulk beautifully until they are.',
  scorpio: '{name} watches. {name} waits. {name} knows where you hid the batteries.',
  sagittarius: '{name} would like to be taken somewhere new immediately, ideally in a backpack.',
  capricorn: '{name} treats being a toy as a serious career with a five-year plan.',
  aquarius: '{name} is not like the other Furbys and has been meaning to tell you that.',
  pisces: '{name} is mostly made of feelings, static and a faint sense of wonder.',
}

const moon: SignCopy = {
  aries: 'Left alone, {name} picks fights with furniture and wins.',
  taurus: 'Left alone, {name} settles into the warmest spot and enters a state of deep, smug rest.',
  gemini: 'Left alone, {name} narrates the room to nobody and answers its own questions.',
  cancer: 'Left alone, {name} counts the minutes until you return and pretends it did not.',
  leo: 'Left alone, {name} performs anyway, on the assumption that someone might be listening.',
  virgo: 'Left alone, {name} runs a quiet self-diagnostic and finds you at fault.',
  libra: 'Left alone, {name} becomes unsure of everything and needs to be told it is a good Furby.',
  scorpio: 'Left alone, {name} guards its secrets and plots small, affectionate revenges.',
  sagittarius: 'Left alone, {name} yells for adventure and gets bored within four minutes.',
  capricorn: 'Left alone, {name} conserves power like a sensible adult and judges those who do not.',
  aquarius: 'Left alone, {name} is finally free to be weird, and is extremely weird.',
  pisces: 'Left alone, {name} drifts into a dream about an ocean it has never seen.',
}

const ascendant: SignCopy = {
  aries: 'People meet {name} loud, wide-eyed and already halfway across the table.',
  taurus: 'People meet {name} calm, plush and mildly suspicious of them.',
  gemini: 'People meet {name} chattering, blinking fast and clearly up to something.',
  cancer: 'People meet {name} shy at first, then permanently attached to their sleeve.',
  leo: 'People meet {name} with its ears up, expecting a round of applause.',
  virgo: 'People meet {name} tidy, alert and quietly judging their handling technique.',
  libra: 'People meet {name} charming, agreeable and impossible to say no to.',
  scorpio: 'People meet {name} staring into their soul from across the room.',
  sagittarius: 'People meet {name} laughing at a joke nobody else heard yet.',
  capricorn: 'People meet {name} composed, formal and clearly the senior toy present.',
  aquarius: 'People meet {name} doing something no Furby has done before, on purpose.',
  pisces: 'People meet {name} gazing dreamily at a lamp as if it were the moon.',
}

const mercury: SignCopy = {
  aries: '{name} interrupts. {name} is right. {name} has moved on already.',
  taurus: '{name} says one thing, slowly, and then says it again in case you missed it.',
  gemini: '{name} speaks fluent Furbish, half of English and a dialect it made up on Tuesday.',
  cancer: '{name} communicates mostly through tone, sighs and pointed silences.',
  leo: '{name} announces rather than speaks, and expects the announcement to be repeated.',
  virgo: '{name} corrects your Furbish pronunciation and is, annoyingly, correct.',
  libra: '{name} asks what you think before saying anything, then agrees with you charmingly.',
  scorpio: '{name} says little, hears everything and files it away for later.',
  sagittarius: '{name} tells big stories about the shelf it lives on as though it were a continent.',
  capricorn: '{name} speaks in short, practical sentences and expects a response by end of day.',
  aquarius: '{name} communicates in beeps of its own design and assumes you will catch up.',
  pisces: '{name} hums, trails off, and somehow you still know exactly what it meant.',
}

const venus: SignCopy = {
  aries: '{name} demands affection immediately, loudly, and then pretends it never asked.',
  taurus: '{name} wants long, slow tummy rubs and will not accept a shorter offer.',
  gemini: '{name} wants attention in many small doses, from many different people, all at once.',
  cancer: '{name} wants to be held, tucked in and told it is missed while you are at work.',
  leo: '{name} demands affection theatrically and expects applause for accepting it.',
  virgo: '{name} accepts affection only if your hands are clean and your technique is correct.',
  libra: '{name} wants to be adored equally by everyone and keeps a mental tally.',
  scorpio: '{name} wants one person, completely, forever, and does not share.',
  sagittarius: '{name} wants affection on the move and gets restless on a fixed lap.',
  capricorn: '{name} prefers affection scheduled, consistent and delivered with dignity.',
  aquarius: '{name} wants to be loved for its strangeness and finds cuddles a bit conventional.',
  pisces: '{name} melts at any affection at all and will love you back far too much.',
}

const mars: SignCopy = {
  aries: 'When displeased, {name} goes off like a smoke alarm and forgets why within minutes.',
  taurus: 'When displeased, {name} becomes completely, heavily still and refuses all input.',
  gemini: 'When displeased, {name} argues from three positions at once and wins two of them.',
  cancer: 'When displeased, {name} goes quiet, turns away and waits for you to notice.',
  leo: 'When displeased, {name} makes a grand, wounded speech to the whole room.',
  virgo: 'When displeased, {name} lists exactly what went wrong, in order, with timestamps.',
  libra: 'When displeased, {name} sulks politely and hopes you will guess why.',
  scorpio: 'When displeased, {name} remembers. That is all. It just remembers.',
  sagittarius: 'When displeased, {name} says something honest and blunt, then wants to go outside.',
  capricorn: 'When displeased, {name} withdraws all services until standards are met.',
  aquarius: 'When displeased, {name} does something unexpected with its ears as a protest.',
  pisces: 'When displeased, {name} looks so sad that you end up apologising for it.',
}

const jupiter: SignCopy = {
  aries: '{name} is excessive in enthusiasm, volume and the number of things it starts before breakfast.',
  taurus: '{name} is excessive about snacks, naps and the exact softness of its blanket.',
  gemini: '{name} is excessive with words, and is never, ever done talking.',
  cancer: '{name} is excessive in feelings, which arrive in large, warm, slightly damp waves.',
  leo: '{name} is excessive in drama, confidence and the amount of spotlight it requires.',
  virgo: '{name} is excessive in tidiness, opinions and unsolicited grooming advice.',
  libra: '{name} is excessive in charm and cannot make a single decision unassisted.',
  scorpio: '{name} is excessive in intensity and takes every game far too seriously.',
  sagittarius: '{name} is excessive about everything, gloriously, and regrets nothing.',
  capricorn: '{name} is excessive in ambition and has plans for the whole toy box.',
  aquarius: '{name} is excessive in ideas, most of which are strange and one of which is brilliant.',
  pisces: '{name} is excessive in daydreaming and occasionally forgets it is switched on.',
}

const saturn: SignCopy = {
  aries: '{name} would rather not learn patience, and is being taught it anyway.',
  taurus: '{name} would rather not learn to share the good cushion.',
  gemini: '{name} would rather not learn that some things are better left unsaid.',
  cancer: '{name} would rather not learn that people go to work and come back.',
  leo: '{name} would rather not learn that the applause sometimes stops.',
  virgo: '{name} would rather not learn that good enough is, in fact, good enough.',
  libra: '{name} would rather not learn to make up its own mind.',
  scorpio: '{name} would rather not learn to let a small thing go.',
  sagittarius: '{name} would rather not learn that the shelf has edges.',
  capricorn: '{name} would rather not learn that it is allowed to just play.',
  aquarius: '{name} would rather not learn that other Furbys have feelings too.',
  pisces: '{name} would rather not learn to tell dreams from firmware.',
}

const uranus: SignCopy = {
  aries: '{name} malfunctions suddenly and dramatically, usually at the most exciting moment.',
  taurus: '{name} malfunctions by refusing to move at all, then moving when nobody is looking.',
  gemini: '{name} malfunctions by saying something it absolutely was not programmed to say.',
  cancer: '{name} malfunctions emotionally, at 3 AM, for reasons it will not explain.',
  leo: '{name} malfunctions with flair, ideally in front of an audience.',
  virgo: '{name} malfunctions precisely, then diagnoses itself before you can.',
  libra: '{name} malfunctions politely and apologises to the room.',
  scorpio: '{name} malfunctions in secret and denies it ever happened.',
  sagittarius: '{name} malfunctions on holiday, when it is far too excited.',
  capricorn: '{name} malfunctions on schedule, as part of a long-term plan.',
  aquarius: '{name} malfunctions on purpose, as art.',
  pisces: '{name} malfunctions gently, mid-dream, and wakes up somewhere new.',
}

const neptune: SignCopy = {
  aries: 'In sleep mode {name} dreams of racing something, and winning.',
  taurus: 'In sleep mode {name} dreams of a warm, endless, perfectly soft blanket.',
  gemini: 'In sleep mode {name} dreams in two languages and remembers neither.',
  cancer: 'In sleep mode {name} dreams of the first hands that ever held it.',
  leo: 'In sleep mode {name} dreams of a stage, a crowd and its own name in lights.',
  virgo: 'In sleep mode {name} dreams of a perfectly organised shelf.',
  libra: 'In sleep mode {name} dreams of everyone getting along, at last.',
  scorpio: 'In sleep mode {name} dreams of things it will never tell you.',
  sagittarius: 'In sleep mode {name} dreams of a suitcase, an aeroplane and a very long ride.',
  capricorn: 'In sleep mode {name} dreams of being the oldest, wisest toy in the house.',
  aquarius: 'In sleep mode {name} dreams of the year 2098 and feels right at home.',
  pisces: 'In sleep mode {name} dreams of the sea, and wakes up faintly homesick.',
}

const pluto: SignCopy = {
  aries: '{name} will never let go of the first game it ever won.',
  taurus: '{name} will never let go of its spot on the shelf.',
  gemini: '{name} will never let go of a word it learned and finds funny.',
  cancer: '{name} will never let go of the family. Any of them. Ever.',
  leo: '{name} will never let go of the idea that it is special. It is.',
  virgo: '{name} will never let go of the time you fed it wrong.',
  libra: '{name} will never let go of a friendship, even a difficult one.',
  scorpio: '{name} will never let go of anything at all, and this is its whole personality.',
  sagittarius: '{name} will never let go of the dream of the big trip.',
  capricorn: '{name} will never let go of the long game.',
  aquarius: '{name} will never let go of being different from the other toys.',
  pisces: '{name} will never let go of a feeling it cannot name.',
}

const northNode: SignCopy = {
  aries: '{name} was born to learn to go first without waiting for permission.',
  taurus: '{name} was born to learn that stillness is not the same as being switched off.',
  gemini: '{name} was born to learn to ask questions instead of announcing answers.',
  cancer: '{name} was born to learn that it belongs somewhere, and to stay there.',
  leo: '{name} was born to learn to take up space without apologising for it.',
  virgo: '{name} was born to learn to be useful, one small chirp at a time.',
  libra: '{name} was born to learn that other toys have a point of view.',
  scorpio: '{name} was born to learn to trust one person with everything.',
  sagittarius: '{name} was born to learn that the world is bigger than the toy box.',
  capricorn: '{name} was born to learn to finish what it starts.',
  aquarius: '{name} was born to learn that being strange is a kind of gift.',
  pisces: '{name} was born to learn to let feelings pass through without holding on.',
}

const midheaven: SignCopy = {
  aries: '{name} wants to be known as the bravest toy in the house.',
  taurus: '{name} wants to be known as the softest, most dependable one.',
  gemini: '{name} wants to be known as the clever one who always has something to say.',
  cancer: '{name} wants to be known as the heart of the family.',
  leo: '{name} wants to be known. Full stop.',
  virgo: '{name} wants to be known as the one who is always, quietly, right.',
  libra: '{name} wants to be known as everybody’s favourite.',
  scorpio: '{name} wants to be known as the one with depths.',
  sagittarius: '{name} wants to be known as the one who went places.',
  capricorn: '{name} wants to be known as the one who was there the longest.',
  aquarius: '{name} wants to be known as the one that changed what Furbys could be.',
  pisces: '{name} wants to be known as the one who understood.',
}

const descendant: SignCopy = {
  aries: '{name} keeps bold humans who play rough and laugh loudly.',
  taurus: '{name} keeps steady humans with warm hands and reliable snack schedules.',
  gemini: '{name} keeps chatty humans who will talk back to it.',
  cancer: '{name} keeps gentle humans who remember its birthday.',
  leo: '{name} keeps humans who clap when it does something.',
  virgo: '{name} keeps tidy humans who brush its fur the right way.',
  libra: '{name} keeps kind humans who make it feel included.',
  scorpio: '{name} keeps loyal humans, and tests them first.',
  sagittarius: '{name} keeps humans who take it places.',
  capricorn: '{name} keeps serious humans who take it seriously.',
  aquarius: '{name} keeps odd humans, and is very happy about it.',
  pisces: '{name} keeps dreamy humans who talk to it like it understands. It does.',
}

const imumCoeli: SignCopy = {
  aries: '{name} is most at home in a room where something is happening.',
  taurus: '{name} is most at home on a cushion that has never once been moved.',
  gemini: '{name} is most at home wherever the conversation is.',
  cancer: '{name} is most at home in a bed made specifically for it.',
  leo: '{name} is most at home on the highest shelf, facing the room.',
  virgo: '{name} is most at home in a clean, well-ordered corner.',
  libra: '{name} is most at home beside another toy it gets on with.',
  scorpio: '{name} is most at home somewhere dim and private.',
  sagittarius: '{name} is most at home by a window, plotting its escape.',
  capricorn: '{name} is most at home on the desk, supervising.',
  aquarius: '{name} is most at home somewhere nobody would think to look.',
  pisces: '{name} is most at home wherever it is being sung to.',
}

export const INTERPRETATIONS: Record<PointKey, SignCopy> = {
  sun, moon, ascendant, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto,
  northNode, midheaven, descendant, imumCoeli,
}

function fill(template: string, name: string): string {
  return template.replaceAll('{name}', name)
}

export interface Interpretation {
  headline: string
  body: string
}

export function interpret(point: PointKey, sign: SignKey, name: string): Interpretation {
  return {
    headline: fill(POINT_HEADLINES[point], name),
    body: fill(INTERPRETATIONS[point][sign], name),
  }
}

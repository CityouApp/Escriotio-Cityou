// As 9 insígnias do Escritório Cityou. Todas desenhadas à mão em SVG (ver InsigniaGlyph.vue).
export const INSIGNIAS = [
  { id: 'dedo', name: 'Dedo do Meio', hint: 'Sem filtro, direto ao ponto', color: '#ffb547', glow: 'rgba(255, 181, 71, .55)' },
  { id: 'coco', name: 'Pedaço de Coco', hint: 'Duro por fora, doce por dentro', color: '#d39a62', glow: 'rgba(240, 220, 190, .5)' },
  { id: 'folha', name: 'Folha da Vila', hint: 'A vontade do fogo', color: '#4ade80', glow: 'rgba(74, 222, 128, .5)' },
  { id: 'sharingan', name: 'Mangekyō Sharingan', hint: 'Enxerga o próximo passo', color: '#ff2d46', glow: 'rgba(255, 45, 70, .55)' },
  { id: 'cardinal', name: 'Cardinal TVCC', hint: 'O vermelho de Taubaté', color: '#ff4b55', glow: 'rgba(255, 75, 85, .5)' },
  { id: 'rasengan', name: 'Rasengan', hint: 'Chakra girando na palma', color: '#5cc8ff', glow: 'rgba(92, 200, 255, .6)' },
  { id: 'shuriken', name: 'Shuriken', hint: 'Rápido e certeiro', color: '#c7d3e3', glow: 'rgba(199, 211, 227, .45)' },
  { id: 'nuvem', name: 'Nuvem Rubra', hint: 'Organização acima de tudo', color: '#ff3b3b', glow: 'rgba(255, 59, 59, .5)' },
  { id: 'piramide', name: 'Pirâmide de Stunt', hint: 'Base firme, voo alto', color: '#ff5fb0', glow: 'rgba(255, 95, 176, .55)' }
]
export const INSIGNIA_BY_ID = Object.fromEntries(INSIGNIAS.map(i => [i.id, i]))

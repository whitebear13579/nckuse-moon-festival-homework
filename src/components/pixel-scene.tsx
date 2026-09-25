const RABBIT = [
  '000100000010000',
  '000110000110000',
  '000110000110000',
  '000111001110000',
  '001111111111000',
  '011111111111100',
  '111111111111110',
  '111111111111111',
  '111111011111111',
  '011111111111110',
  '001111111111100',
  '000111111111000',
  '000011111110000',
  '000001101100000',
]

function PixelRabbit() {
  return (
    <svg className="rabbit-sprite" viewBox="0 0 15 14" shapeRendering="crispEdges" role="img" aria-label="站在月亮前的像素月兔">
      {RABBIT.flatMap((row, y) => Array.from(row).map((cell, x) => cell === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null))}
      <rect x="10" y="7" width="1" height="1" className="rabbit-eye" />
    </svg>
  )
}

function PixelMoon() {
  const pixels = []
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    const distance = (x - 12) ** 2 + (y - 12) ** 2
    if (distance <= 130) pixels.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={distance > 105 ? 'moon-edge' : 'moon-fill'} />)
  }
  return <svg className="moon-sprite" viewBox="0 0 25 25" shapeRendering="crispEdges" aria-hidden="true">{pixels}</svg>
}

export function PixelScene({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`pixel-scene ${compact ? 'pixel-scene-compact' : ''}`} aria-label="中秋夜的像素月兔與燈籠" role="img">
      <div className="scene-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <PixelMoon />
      <div className="scene-hill hill-back" aria-hidden="true" />
      <div className="scene-hill hill-front" aria-hidden="true" />
      <PixelRabbit />
      <div className="scene-lantern lantern-one" aria-hidden="true"><span /></div>
      <div className="scene-lantern lantern-two" aria-hidden="true"><span /></div>
      <div className="scene-lantern lantern-three" aria-hidden="true"><span /></div>
      <div className="scene-ground" aria-hidden="true" />
    </div>
  )
}

import { useState } from 'react'
import { FontGate } from '@/fonts/FontGate'
import { ProductApp } from '@/product/ProductApp'
import { Controls } from './Controls'
import { Composites } from './Composites'
import { FilmCapture } from './FilmCapture'
import { FilmRuntime } from './FilmRuntime'
import { Foundation } from './Foundation'
import { Overlays } from './Overlays'
import { parseParams } from './params'
import { ProductRoot } from './ProductRoot'

export function App() {
  const [initial] = useState(() => parseParams(window.location.search))
  const [theme, setTheme] = useState(initial.theme)

  if (initial.view === 'product') {
    return (
      <FontGate>
        <ProductApp search={window.location.search} mode={initial.mode} />
      </FontGate>
    )
  }

  return (
    <FontGate>
      <ProductRoot theme={theme} mode={initial.mode}>
        {initial.view === 'controls' ? (
          <Controls
            theme={theme}
            onThemeChange={setTheme}
            initialFrame={initial.frame}
            initialRunning={initial.running}
            initialRoleOpen={initial.roleOpen}
          />
        ) : initial.view === 'overlays' ? (
          <Overlays
            theme={theme}
            onThemeChange={setTheme}
            initialFrame={initial.frame}
            initialOverlay={initial.overlay}
          />
        ) : initial.view === 'film-runtime' ? (
          <FilmRuntime
            theme={theme}
            onThemeChange={setTheme}
            initialFrame={initial.frame}
            reducedMotion={initial.reducedMotion}
            chrome={initial.mode !== 'film'}
          />
        ) : initial.view === 'film-capture' ? (
          <FilmCapture />
        ) : initial.view === 'composites' ? (
          <Composites theme={theme} onThemeChange={setTheme} initialFrame={initial.frame} />
        ) : (
          <Foundation
            theme={theme}
            onThemeChange={setTheme}
            initialFrame={initial.frame}
            initialRunning={initial.running}
          />
        )}
      </ProductRoot>
    </FontGate>
  )
}

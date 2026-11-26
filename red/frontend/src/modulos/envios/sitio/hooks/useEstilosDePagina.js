import { useLayoutEffect } from 'react'

// Inserta el CSS de la página mientras esté montada y lo quita al salir.
export default function useEstilosDePagina(css) {
  useLayoutEffect(() => {
    const el = document.createElement('style')
    el.textContent = css
    document.head.append(el)
    return () => el.remove()
  }, [css])
}

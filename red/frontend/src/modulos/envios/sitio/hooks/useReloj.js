import { useEffect, useState } from 'react'

export default function useReloj(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return ahora
}

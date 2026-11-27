import { useCarrusel } from "../hooks/useCarrusel";

// Props: slides = [{ src, alt }]
export default function Carrusel({ slides }) {
  const [activo, setActivo] = useCarrusel(slides.length);

  return (
    <div className="hero-carousel">
      {slides.map((s, i) => (
        <div key={s.src} className={`carousel-slide ${i === activo ? "active" : ""}`} aria-hidden={i !== activo}>
          <img src={s.src} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} />
          <div className="carousel-overlay"></div>
        </div>
      ))}
      <div className="carousel-dots">
        {slides.map((_, i) => (
          <button key={i} type="button" className={`dot ${i === activo ? "active" : ""}`}
            aria-label={`Ver imagen ${i + 1} de ${slides.length}`} aria-current={i === activo}
            onClick={() => setActivo(i)}></button>
        ))}
      </div>
    </div>
  );
}

import { inicial } from "../avatares";

// Si por lo que sea no trae color, gris, que no desentone.
function Avatar({ nombre, color, pequeno = false, latiendo = false }) {
  return (
    <span
      className={`avatar ${pequeno ? "avatar-pequeno" : ""} ${latiendo ? "latiendo" : ""}`}
      style={{ "--color-avatar": color ?? "var(--tinta-tenue)" }}
      aria-hidden="true"
    >
      {inicial(nombre)}
    </span>
  );
}

export default Avatar;

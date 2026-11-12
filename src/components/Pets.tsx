import petsUrl from "../assets/pets.png";

// The puppy and kitten picture (transparent background), with a soft shadow.
export default function Pets({ className }: { className?: string }) {
  return (
    <img
      src={petsUrl}
      alt="A happy puppy and kitten"
      className={className}
      draggable={false}
      style={{ filter: "drop-shadow(0 6px 8px rgba(70, 60, 30, 0.28))" }}
    />
  );
}

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight ${className}`}>
      Ola <span className="text-accent">Hop</span>
    </span>
  );
}

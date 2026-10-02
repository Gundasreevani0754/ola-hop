export default function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-muted ${className}`}>
      Concept prototype for an APM assessment · not an official Ola product · simulated data
    </p>
  );
}

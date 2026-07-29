import cyrisLogo from '@/assets/cyris-logo.png';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <img src={cyrisLogo} alt="Cyris Logo" className="h-20 w-auto object-contain animate-pulse" />
          <span className="font-display text-lg font-bold text-primary tracking-wide">Cyris</span>
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Under Maintenance</h1>
          <p className="text-muted-foreground leading-relaxed">
            Our website is currently undergoing scheduled maintenance. We'll be back shortly. Thank you for your patience.
          </p>
        </div>
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Maintenance in progress
          </div>
        </div>
      </div>
    </div>
  );
}

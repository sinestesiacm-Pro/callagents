export function CallAnimation({ phone }: { phone: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Avatar ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-[ping_2s_ease-out_infinite]" />
        <div className="absolute h-20 w-20 rounded-full bg-primary/20 animate-[ping_2s_ease-out_infinite_0.3s]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container shadow-lg">
          <span className="material-symbols-outlined text-3xl text-on-primary">support_agent</span>
        </div>
      </div>

      {/* Phone number */}
      <div className="text-center">
        <p className="text-lg font-semibold text-on-surface">{phone}</p>
        <p className="mt-1 text-sm text-on-surface-variant">Chiamata in corso...</p>
      </div>

      {/* Waveform bars */}
      <div className="flex items-end gap-[3px] h-10">
        {[1, 0.7, 1.3, 0.5, 1.1, 0.6, 0.9].map((scale, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-primary/60"
            style={{
              height: "100%",
              animation: `wave 0.8s ease-in-out ${i * 0.12}s infinite`,
              transformOrigin: "center",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

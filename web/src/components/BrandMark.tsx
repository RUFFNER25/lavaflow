type Props = {
  name?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
};

const sizes = {
  sm: "size-9 rounded-xl text-xs",
  md: "size-10 rounded-2xl text-sm",
  lg: "size-16 rounded-[1.25rem] text-lg",
};

export function BrandMark({
  name,
  logoUrl,
  size = "md",
  showName = false,
  className = "",
}: Props) {
  const box = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name || "Logo"}
          className={`${box} object-contain bg-white ring-1 ring-sky-100 shadow-sm`}
        />
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-sky-400 to-blue-600 font-extrabold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.8)] ${box}`}
        >
          LF
        </div>
      )}
      {showName && (
        <div className="min-w-0">
          <div className="truncate font-display text-base font-semibold tracking-tight text-sky-950 sm:text-lg">
            {name || (
              <>
                Lava<span className="text-sky-500">Flow</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

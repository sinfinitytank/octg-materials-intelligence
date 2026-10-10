/** Conceptual completion cutaway; intentionally independent of screening inputs. */
export default function WellSchematic() {
  return (
    <figure className="well-art">
      <svg viewBox="0 0 480 350" role="img" aria-labelledby="well-art-title well-art-desc">
        <title id="well-art-title">Casing and production tubing well cutaway</title>
        <desc id="well-art-desc">
          Nested surface, intermediate and production casing cemented into the formation. Production
          tubing runs inside the casing through a packer above the perforated interval. Conceptual
          illustration, not to scale.
        </desc>
        <defs>
          <linearGradient id="well-steel" x1="0" x2="1">
            <stop stopColor="#526f7b" />
            <stop offset=".35" stopColor="#c1d0cb" />
            <stop offset=".6" stopColor="#6c8990" />
            <stop offset="1" stopColor="#304e5b" />
          </linearGradient>
          <linearGradient id="well-tube" x1="0" x2="1">
            <stop stopColor="#388d80" />
            <stop offset=".45" stopColor="#c3eed5" />
            <stop offset="1" stopColor="#549f90" />
          </linearGradient>
          <pattern
            id="well-cement"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <path d="M0 0V7" stroke="#87a49d" strokeWidth="2" opacity=".35" />
          </pattern>
          <pattern id="well-rock" width="24" height="18" patternUnits="userSpaceOnUse">
            <path d="M0 9h13m5 0h6M7 0v3m12 12v6" stroke="#8ba39b" strokeWidth=".6" opacity=".18" />
          </pattern>
        </defs>
        <text x="22" y="24" fill="#b6d4c9" fontSize="10" letterSpacing="2">
          THE WELL / COMPLETION CUTAWAY
        </text>
        <rect x="38" y="77" width="255" height="245" rx="8" fill="url(#well-rock)" />
        <path d="M38 124h255M38 192h255M38 260h255" stroke="#b2c9b9" opacity=".12" />
        <path d="M38 77h255" stroke="#8db3a5" />
        {/* Cement sheath and successively deeper casing strings. */}
        <path
          d="M100 77v105h20V77m90 0v105h20V77M124 77v162h16V77m50 0v162h16V77M143 77v235h12V77m20 0v235h12V77"
          fill="url(#well-cement)"
        />
        <path
          d="M116 76v108h8V76m82 0v108h8V76M136 76v165h8V76m42 0v165h8V76M152 76v236h7V76m12 0v236h7V76"
          fill="url(#well-steel)"
          stroke="#b4c9c4"
          strokeWidth=".5"
        />
        {/* Wellhead and production tubing. */}
        <rect x="127" y="64" width="76" height="12" rx="3" fill="url(#well-steel)" />
        <rect x="145" y="49" width="40" height="15" rx="2" fill="#72908e" stroke="#b2c9c4" />
        <path d="M161 49v232h8V49" fill="url(#well-tube)" />
        <rect x="148" y="44" width="34" height="5" rx="2" fill="#c1d6c8" />
        <path d="M159 249h12v14h-12" fill="#d3b77d" />
        <path d="M159 252h12m-12 4h12m-12 4h12" stroke="#846d45" />
        <path d="M165 233V100m-4 7 4-7 4 7" fill="none" stroke="#d4f4df" strokeWidth="1.2" />
        {[285, 295, 305].map((y) => (
          <path key={y} d={`M152 ${y}l-12 5m38-5 12 5`} stroke="#d3b77d" strokeWidth="1.5" />
        ))}
        <g fill="none" stroke="#9dc3b5" strokeWidth=".8">
          <path d="M214 112h82l14-10h18M194 207h102l14-10h18M178 273h118l14-10h18M169 143h127l14 10h18M171 256h102l37-28h18" />
        </g>
        <g fill="#e0ebe4" fontSize="11" fontWeight="500">
          <text x="333" y="106">
            Surface casing
          </text>
          <text x="333" y="157">
            Production tubing
          </text>
          <text x="333" y="201">
            Intermediate casing
          </text>
          <text x="333" y="232">
            Production packer
          </text>
          <text x="333" y="267">
            Production casing
          </text>
        </g>
        <g fill="#a4bcb5" fontSize="9">
          <text x="47" y="340">
            CEMENTED ANNULI
          </text>
          <text x="281" y="340">
            CONCEPTUAL · NOT TO SCALE
          </text>
        </g>
        <circle cx="214" cy="112" r="2" fill="#c3dfc6" />
        <circle cx="169" cy="143" r="2" fill="#c3dfc6" />
      </svg>
    </figure>
  );
}

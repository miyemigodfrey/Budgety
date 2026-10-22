"use client";

/**
 * Budgety launch / loading screen. Two original mascots greet, then fade to a
 * soft backdrop as the logo bounces in; a progress bar runs in the footer.
 * Plays once and holds (not a loop) so it reads as a launch, then unmounts when
 * the app is ready. Scene colors are fixed illustration values; the background,
 * text, and brand pull from the app's theme tokens so it adapts to dark mode.
 */
const CSS = `
.bl-root {
  position: fixed; inset: 0; z-index: 60;
  display: flex; flex-direction: column;
  background: var(--app-background);
  color: var(--foreground);
  overflow: hidden;
  font-family: inherit;
  --skin:#ffe4cf; --hairA:#5e9bff; --hairB:#ff8a6b; --hairB2:#ee6d4e;
  --eye:#3b3550; --blush:#ff9d86; --outfitA:#3b82f6; --outfitB:#ff6b6b;
  --bow:#ff5d6c; --coin:#ffd24d; --coinE:#e2982f; --brandL:#8fbcff;
  --tileA:#8fbcff; --tileB:#2563eb; --tileC:#1d4ed8;
}
.bl-stage { flex:1; position:relative; display:grid; place-items:center; min-height:0; }
.bl-anime { position:absolute; inset:0; display:grid; place-items:center;
  animation: bl-animeIn 2.6s ease-in-out forwards; }
.bl-anime svg { width:min(94%,440px); height:auto; overflow:visible; }
.bl-char { animation: bl-bob 3s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 72%; }
.bl-char.b { animation-delay:.5s; }
.bl-wave { animation: bl-wave 1.6s ease-in-out infinite; transform-box:fill-box; transform-origin:85% 90%; }
.bl-eyes { animation: bl-blink 4.2s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
.bl-eyes.b { animation-delay:2.1s; }
.bl-brand { position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; gap:18px;
  animation: bl-brandIn 2.6s ease-in-out forwards; }
.bl-tile { width:82px; height:82px; border-radius:22px;
  background: linear-gradient(150deg, var(--tileA) -8%, var(--tileB) 50%, var(--tileC) 112%);
  box-shadow: 0 16px 36px -12px rgba(37,99,235,.5), inset 0 1px 0 rgba(255,255,255,.45);
  display:grid; place-items:center; }
.bl-tile svg { width:44px; height:44px; }
.bl-word { font-size:30px; font-weight:800; letter-spacing:-.02em; color:var(--foreground); }
.bl-footer { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:10px;
  padding-block:10px 0; padding-bottom:max(26px, env(safe-area-inset-bottom,0px)); }
.bl-prog { width:184px; height:5px; border-radius:999px; background:var(--border); overflow:hidden; position:relative; }
.bl-prog::after { content:""; position:absolute; top:0; left:-45%; height:100%; width:45%; border-radius:999px;
  background: linear-gradient(90deg, transparent, var(--brand), var(--brandL), transparent);
  animation: bl-slide 1.5s cubic-bezier(.65,0,.35,1) infinite; }
.bl-tag { margin:0; font-size:12.5px; font-weight:500; color:var(--muted-foreground); letter-spacing:.02em; }
@keyframes bl-animeIn {
  0% { opacity:0; transform:scale(.9) translateY(10px); }
  20% { opacity:1; transform:scale(1) translateY(0); }
  46% { opacity:1; transform:scale(1) translateY(0); }
  60% { opacity:.2; transform:scale(1.12); }
  100% { opacity:.2; transform:scale(1.12); }
}
@keyframes bl-brandIn {
  0%,46% { opacity:0; transform:translateY(18px) scale(.6); }
  74% { opacity:1; transform:translateY(0) scale(1.08); }
  84% { transform:translateY(0) scale(.98); }
  92% { transform:translateY(0) scale(1.02); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes bl-bob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
@keyframes bl-wave { 0%,100% { transform:rotate(-6deg); } 50% { transform:rotate(16deg); } }
@keyframes bl-blink { 0%,5%,100% { transform:scaleY(1); } 2.5% { transform:scaleY(.1); } }
@keyframes bl-slide { to { left:100%; } }
@media (prefers-reduced-motion: reduce) {
  .bl-anime { animation:none; opacity:.2; }
  .bl-brand { animation:none; opacity:1; }
  .bl-char,.bl-eyes,.bl-wave,.bl-prog::after { animation:none; }
}
`;

export function AppLoader() {
	return (
		<div className="bl-root" role="status" aria-label="Loading Budgety">
			<style>{CSS}</style>
			<div className="bl-stage">
				<div className="bl-anime">
					<svg viewBox="0 0 380 340" aria-hidden="true">
						<defs>
							<radialGradient id="blAuraA" cx="50%" cy="46%" r="55%">
								<stop offset="0%" stopColor="#6ea8ff" stopOpacity=".4" />
								<stop offset="100%" stopColor="#6ea8ff" stopOpacity="0" />
							</radialGradient>
							<radialGradient id="blAuraB" cx="50%" cy="46%" r="55%">
								<stop offset="0%" stopColor="#ff9d86" stopOpacity=".4" />
								<stop offset="100%" stopColor="#ff9d86" stopOpacity="0" />
							</radialGradient>
						</defs>
						<ellipse cx="124" cy="176" rx="128" ry="140" fill="url(#blAuraA)" />
						<ellipse cx="256" cy="180" rx="124" ry="138" fill="url(#blAuraB)" />
						<ellipse cx="124" cy="306" rx="70" ry="13" fill="#1b2a4a" opacity=".07" />
						<ellipse cx="256" cy="308" rx="66" ry="12" fill="#1b2a4a" opacity=".07" />

						<g className="bl-char a">
							<rect x="88" y="204" width="72" height="80" rx="34" fill="var(--outfitA)" />
							<circle cx="124" cy="234" r="4.5" fill="#fff" opacity=".9" />
							<circle cx="124" cy="256" r="4.5" fill="#fff" opacity=".9" />
							<rect x="100" y="276" width="18" height="18" rx="8" fill="var(--outfitA)" />
							<rect x="130" y="276" width="18" height="18" rx="8" fill="var(--outfitA)" />
							<ellipse cx="86" cy="226" rx="12" ry="16" fill="var(--outfitA)" />
							<g className="bl-wave">
								<ellipse cx="166" cy="214" rx="12" ry="16" fill="var(--outfitA)" />
								<circle cx="170" cy="200" r="9" fill="var(--skin)" />
							</g>
							<circle cx="124" cy="140" r="54" fill="var(--hairA)" />
							<circle cx="124" cy="150" r="49" fill="var(--skin)" />
							<path d="M78 140 Q88 94 124 98 Q160 94 170 140 Q160 114 124 118 Q88 114 78 140 Z" fill="var(--hairA)" />
							<circle cx="96" cy="118" r="15" fill="var(--hairA)" />
							<circle cx="124" cy="110" r="16" fill="var(--hairA)" />
							<circle cx="152" cy="118" r="15" fill="var(--hairA)" />
							<g className="bl-eyes a">
								<ellipse cx="108" cy="152" rx="9" ry="11.5" fill="var(--eye)" />
								<ellipse cx="140" cy="152" rx="9" ry="11.5" fill="var(--eye)" />
								<circle cx="105" cy="148" r="3.4" fill="#fff" />
								<circle cx="137" cy="148" r="3.4" fill="#fff" />
								<circle cx="111" cy="155" r="1.6" fill="#fff" />
								<circle cx="143" cy="155" r="1.6" fill="#fff" />
							</g>
							<ellipse cx="97" cy="168" rx="8" ry="5" fill="var(--blush)" opacity=".8" />
							<ellipse cx="151" cy="168" rx="8" ry="5" fill="var(--blush)" opacity=".8" />
							<path d="M114 170 Q124 182 134 170 Q124 176 114 170 Z" fill="var(--eye)" />
							<circle cx="166" cy="240" r="14" fill="var(--coin)" stroke="var(--coinE)" strokeWidth="2.4" />
							<text x="166" y="245" fontSize="14" fontWeight="800" textAnchor="middle" fill="var(--coinE)">$</text>
						</g>

						<g className="bl-char b">
							<path d="M222 206 Q256 196 290 206 L300 284 Q256 294 212 284 Z" fill="var(--outfitB)" />
							<circle cx="256" cy="236" r="4.5" fill="#fff" opacity=".9" />
							<rect x="230" y="278" width="18" height="18" rx="8" fill="var(--outfitB)" />
							<rect x="264" y="278" width="18" height="18" rx="8" fill="var(--outfitB)" />
							<ellipse cx="214" cy="228" rx="11" ry="15" fill="var(--outfitB)" />
							<ellipse cx="298" cy="228" rx="11" ry="15" fill="var(--outfitB)" />
							<circle cx="300" cy="216" r="9" fill="var(--skin)" />
							<circle cx="256" cy="146" r="53" fill="var(--hairB)" />
							<circle cx="256" cy="155" r="47" fill="var(--skin)" />
							<path d="M210 146 Q220 100 256 104 Q292 100 302 146 Q292 120 256 124 Q220 120 210 146 Z" fill="var(--hairB)" />
							<circle cx="222" cy="166" r="16" fill="var(--hairB)" />
							<circle cx="290" cy="166" r="16" fill="var(--hairB)" />
							<path d="M244 100 l-14 -4 6 13 Z" fill="var(--bow)" />
							<path d="M268 100 l14 -4 -6 13 Z" fill="var(--bow)" />
							<circle cx="256" cy="102" r="6" fill="var(--bow)" />
							<g className="bl-eyes b">
								<ellipse cx="241" cy="158" rx="8.5" ry="11" fill="var(--eye)" />
								<ellipse cx="271" cy="158" rx="8.5" ry="11" fill="var(--eye)" />
								<circle cx="238" cy="154" r="3.2" fill="#fff" />
								<circle cx="268" cy="154" r="3.2" fill="#fff" />
								<circle cx="244" cy="161" r="1.5" fill="#fff" />
								<circle cx="274" cy="161" r="1.5" fill="#fff" />
							</g>
							<ellipse cx="231" cy="173" rx="7.5" ry="4.5" fill="var(--blush)" opacity=".8" />
							<ellipse cx="281" cy="173" rx="7.5" ry="4.5" fill="var(--blush)" opacity=".8" />
							<path d="M247 175 Q256 186 265 175 Q256 181 247 175 Z" fill="var(--eye)" />
							<circle cx="300" cy="238" r="12" fill="var(--coin)" stroke="var(--coinE)" strokeWidth="2.2" />
						</g>

						<path d="M196 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" fill="var(--brandL)" opacity=".8" />
						<path d="M78 86 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="var(--coin)" opacity=".8" />
						<path d="M312 100 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="var(--hairB)" opacity=".7" />
					</svg>
				</div>

				<div className="bl-brand">
					<div className="bl-tile">
						<svg viewBox="0 0 48 48" aria-hidden="true">
							<rect x="7" y="17" width="34" height="23" rx="6" fill="#fff" />
							<path d="M7 23 h34" stroke="#2563eb" strokeWidth="2" opacity=".16" />
							<rect x="27" y="25" width="16" height="9" rx="4.5" fill="#bcd6ff" />
							<circle cx="33" cy="29.5" r="2.4" fill="#fff" />
							<circle cx="24" cy="12" r="6" fill="#ffd24d" stroke="#fff" strokeWidth="1.4" />
						</svg>
					</div>
					<div className="bl-word">Budgety</div>
				</div>
			</div>

			<div className="bl-footer">
				<div className="bl-prog" aria-hidden="true" />
				<p className="bl-tag">Loading your budget…</p>
			</div>
		</div>
	);
}

import { motion, AnimatePresence } from 'framer-motion';

export interface MediaInfo {
  title: string;
  artist: string;
  albumTitle: string;
  albumArtist: string;
  thumbnail: string; // base64 PNG data URI
  contentType: string;
}

interface MediaInfoPanelProps {
  info: MediaInfo | null;
  accentHex: string;
}

export function MediaInfoPanel({ info, accentHex }: MediaInfoPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {info && (info.title || info.artist) && (
        <motion.div
          key={info.title + info.artist + info.albumTitle}
          initial={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-[40px] right-[60px] z-50 pointer-events-none select-none"
        >
          {/* Outer glass pane */}
          <div
            className="relative overflow-hidden rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(40px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* ── Glass edge light reflection ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '-1px',
                right: '-1px',
                width: '70px',
                height: '50px',
                background: `radial-gradient(ellipse at 100% 0%, ${accentHex}44 0%, ${accentHex}11 40%, transparent 70%)`,
                borderRadius: '0 0.5rem 0 0',
              }}
            />

            {/* ── Subtle liquid shimmer overlay ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${accentHex}08 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)`,
              }}
            />

            {/* ── Content ── */}
            <div className="relative flex items-center gap-4 px-4 py-3.5">
              {/* Album art thumbnail */}
              {info.thumbnail ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="flex-shrink-0 w-[52px] h-[52px] rounded-sm overflow-hidden border border-white/10"
                  style={{
                    boxShadow: `0 0 16px ${accentHex}22, 0 2px 8px rgba(0,0,0,0.5)`,
                  }}
                >
                  <img
                    src={info.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : (
                <div
                  className="flex-shrink-0 w-[52px] h-[52px] rounded-sm flex items-center justify-center border border-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${accentHex}22, ${accentHex}08)`,
                  }}
                >
                  <span
                    className="text-[20px]"
                    style={{ color: accentHex, opacity: 0.6 }}
                  >
                    ♫
                  </span>
                </div>
              )}

              {/* Text info */}
              <div className="min-w-0 flex flex-col gap-0.5">
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className="text-[13px] font-medium text-white/90 truncate max-w-[200px]"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                  title={info.title}
                >
                  {info.title}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="text-[11px] text-white/55 truncate max-w-[200px]"
                  title={info.artist}
                >
                  {info.artist || 'Unknown artist'}
                </motion.div>

                {(info.albumTitle || info.albumArtist) && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="text-[10px] text-white/30 truncate max-w-[200px] flex items-center gap-1"
                  >
                    {info.albumTitle && <span>{info.albumTitle}</span>}
                    {info.albumTitle && info.albumArtist && (
                      <span style={{ color: accentHex, opacity: 0.5 }}>·</span>
                    )}
                    {info.albumArtist && <span className="opacity-60">{info.albumArtist}</span>}
                  </motion.div>
                )}
              </div>

              {/* Playing indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="flex-shrink-0 flex items-end gap-[2px] h-5 self-end mb-0.5"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[2px] rounded-full"
                    style={{ backgroundColor: accentHex }}
                    animate={{
                      height: [4, 14, 6, 16, 4][i * 2 % 5 + Math.floor(Date.now() / 200) % 3] || 8,
                      opacity: [0.5, 0.9, 0.6, 1, 0.5][i * 2 % 5 + Math.floor(Date.now() / 200) % 3] || 0.7,
                    }}
                    transition={{
                      duration: 0.6 + i * 0.15,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

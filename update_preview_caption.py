with open('frontend/src/features/workspace/components/VideoPreview/VideoPreviewPane.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                width: captionStyle.customWidth ? `${Math.round(captionStyle.customWidth * canvasScale)}px` : 'fit-content',
                minWidth: 'min(75%, 260px)',
                maxWidth: '92%',
                boxSizing: 'border-box',
              }}
            >
              <div
                className={`pointer-events-none w-full max-w-full flex items-center justify-center text-center ${
                  useCaptionPreset
                    ? activeCaptionPresetClass
                    : `font-black text-center ${captionSizeClass} bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 shadow-2xl`
                }`}
                style={{
                  backgroundColor: useCaptionPreset ? undefined : captionStyle.background,
                  borderRadius: useCaptionPreset ? undefined : `${Math.max(8, Math.round(captionStyle.bgRadius * canvasScale))}px`,
                  padding: useCaptionPreset ? undefined : `${Math.round(captionStyle.bgPadding * canvasScale)}px`,
                  color: useCaptionPreset
                    ? activeCaptionPresetColor || captionStyle.color || captionColor
                    : captionStyle.color || captionColor,
                  filter: useCaptionPreset ? 'none' : undefined,
                  fontFamily: useCaptionPreset ? activeCaptionPresetFontFamily : captionStyle.fontFamily,
                  fontSize: `${scaledCaptionFontSize}px`,
                  fontWeight: useCaptionPreset ? captionPresetFontWeight : !captionStyle.isBold ? 400 : captionStyle.fontWeight === 'Black' ? 900
                    : captionStyle.fontWeight === 'ExtraBold' ? 800
                      : captionStyle.fontWeight === 'Bold' ? 700
                        : captionStyle.fontWeight === 'SemiBold' ? 600
                          : captionStyle.fontWeight === 'Medium' ? 500 : 400,
                  textAlign: 'center',
                  textTransform: useCaptionPreset ? captionPresetTextTransform : captionStyle.textTransform,
                  fontStyle: useCaptionPreset ? undefined : captionStyle.isItalic ? 'italic' : 'normal',
                  textDecoration: useCaptionPreset ? undefined : [
                    captionStyle.isUnderline ? 'underline' : '',
                    captionStyle.isStrikethrough ? 'line-through' : '',
                  ].filter(Boolean).join(' ') || 'none',
                  letterSpacing: useCaptionPreset ? undefined : `${captionStyle.letterSpacing}em`,
                  lineHeight: useCaptionPreset ? 1.3 : captionStyle.lineHeight,
                  textShadow: useCaptionPreset
                    ? undefined
                    : captionStyle.neonGlow
                    ? `0 0 ${Math.round(10 * canvasScale)}px ${captionStyle.glowColor}, 0 0 ${Math.round(20 * canvasScale)}px ${captionStyle.glowColor}`
                    : captionStyle.dropShadow
                      ? `0 ${Math.max(1, Math.round(2 * canvasScale))}px ${Math.round(captionStyle.shadowBlur * canvasScale)}px ${captionStyle.shadowColor}`
                      : 'none',
                  WebkitTextStroke: useCaptionPreset
                    ? undefined
                    : captionStyle.stroke
                    ? `${Math.max(1, Math.round(captionStyle.strokeWidth * canvasScale))}px ${captionStyle.strokeColor}`
                    : 'none',
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'normal',
                  hyphens: 'none',
                  textWrap: 'balance',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  rowGap: '2px',
                }}
              >
                {effectiveWords.length > 0 ? (
                  effectiveWords.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    const isPast = currentTime > w.end;
                    return (
                      <span
                        key={wIdx}
                        className={`inline-block transition-all duration-100 mx-[0.16em] my-[0.04em] ${
                          isWordActive ? 'font-black' : ''
                        }`}
                        style={{
                          whiteSpace: 'nowrap',
                          color: isWordActive
                            ? (w.highlightColor || '#FACC15')
                            : isPast
                            ? (useCaptionPreset ? activeCaptionPresetColor || captionStyle.color : captionStyle.color)
                            : undefined,
                          textShadow: isWordActive
                            ? '0 0 16px rgba(250, 204, 21, 0.75), 0 2px 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 2px 0 0 #000, 0 4px 12px rgba(0,0,0,0.95)'
                            : '0 2px 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 2px 0 0 #000, 0 3px 6px rgba(0,0,0,0.7)',
                          WebkitTextStroke: isWordActive ? '1px #000' : '0.5px #000',
                          opacity: isPast ? 0.95 : isWordActive ? 1 : 0.75,
                          transform: isWordActive ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                        }}
                      >
                        {w.word}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ display: 'inline-block', textWrap: 'balance', wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none', whiteSpace: 'nowrap' }}>
                    {visibleSubtitle}
                  </span>
                )}
              </div>'''

replacement = '''                width: captionStyle.customWidth ? `${Math.round(captionStyle.customWidth * canvasScale)}px` : 'auto',
                maxWidth: '88%',
                minWidth: 'min(82%, 300px)',
                boxSizing: 'border-box',
              }}
            >
              <div
                className={`pointer-events-none w-full max-w-full text-center ${
                  useCaptionPreset
                    ? activeCaptionPresetClass
                    : `font-black text-center ${captionSizeClass} bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 shadow-2xl`
                }`}
                style={{
                  backgroundColor: useCaptionPreset ? undefined : captionStyle.background,
                  borderRadius: useCaptionPreset ? undefined : `${Math.max(8, Math.round(captionStyle.bgRadius * canvasScale))}px`,
                  padding: useCaptionPreset ? undefined : `${Math.round(captionStyle.bgPadding * canvasScale)}px`,
                  color: useCaptionPreset
                    ? activeCaptionPresetColor || captionStyle.color || captionColor
                    : captionStyle.color || captionColor,
                  filter: useCaptionPreset ? 'none' : undefined,
                  fontFamily: useCaptionPreset ? activeCaptionPresetFontFamily : captionStyle.fontFamily,
                  fontSize: `${scaledCaptionFontSize}px`,
                  fontWeight: useCaptionPreset ? captionPresetFontWeight : !captionStyle.isBold ? 400 : captionStyle.fontWeight === 'Black' ? 900
                    : captionStyle.fontWeight === 'ExtraBold' ? 800
                      : captionStyle.fontWeight === 'Bold' ? 700
                        : captionStyle.fontWeight === 'SemiBold' ? 600
                          : captionStyle.fontWeight === 'Medium' ? 500 : 400,
                  textAlign: 'center',
                  textTransform: useCaptionPreset ? captionPresetTextTransform : captionStyle.textTransform,
                  fontStyle: useCaptionPreset ? undefined : captionStyle.isItalic ? 'italic' : 'normal',
                  textDecoration: useCaptionPreset ? undefined : [
                    captionStyle.isUnderline ? 'underline' : '',
                    captionStyle.isStrikethrough ? 'line-through' : '',
                  ].filter(Boolean).join(' ') || 'none',
                  letterSpacing: useCaptionPreset ? undefined : `${captionStyle.letterSpacing}em`,
                  lineHeight: useCaptionPreset ? 1.35 : captionStyle.lineHeight,
                  textShadow: useCaptionPreset
                    ? undefined
                    : captionStyle.neonGlow
                    ? `0 0 ${Math.round(10 * canvasScale)}px ${captionStyle.glowColor}, 0 0 ${Math.round(20 * canvasScale)}px ${captionStyle.glowColor}`
                    : captionStyle.dropShadow
                      ? `0 ${Math.max(1, Math.round(2 * canvasScale))}px ${Math.round(captionStyle.shadowBlur * canvasScale)}px ${captionStyle.shadowColor}`
                      : 'none',
                  WebkitTextStroke: useCaptionPreset
                    ? undefined
                    : captionStyle.stroke
                    ? `${Math.max(1, Math.round(captionStyle.strokeWidth * canvasScale))}px ${captionStyle.strokeColor}`
                    : 'none',
                  whiteSpace: 'normal',
                  wordBreak: 'keep-all',
                  overflowWrap: 'normal',
                  hyphens: 'none',
                  textWrap: 'balance',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              >
                {effectiveWords.length > 0 ? (
                  effectiveWords.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    const isPast = currentTime > w.end;
                    return (
                      <span
                        key={wIdx}
                        className={`inline-block transition-all duration-100 mx-[0.18em] my-[0.06em] select-none ${
                          isWordActive ? 'font-black' : ''
                        }`}
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          wordBreak: 'keep-all',
                          overflowWrap: 'normal',
                          hyphens: 'none',
                          color: isWordActive
                            ? (w.highlightColor || '#FACC15')
                            : isPast
                            ? (useCaptionPreset ? activeCaptionPresetColor || captionStyle.color : captionStyle.color)
                            : undefined,
                          textShadow: isWordActive
                            ? '0 0 16px rgba(250, 204, 21, 0.75), 0 2px 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 2px 0 0 #000, 0 4px 12px rgba(0,0,0,0.95)'
                            : '0 2px 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 2px 0 0 #000, 0 3px 6px rgba(0,0,0,0.7)',
                          WebkitTextStroke: isWordActive ? '1px #000' : '0.5px #000',
                          opacity: isPast ? 0.95 : isWordActive ? 1 : 0.75,
                          transform: isWordActive ? 'scale(1.08) translateY(-1px)' : 'scale(1)',
                        }}
                      >
                        {w.word}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ display: 'inline-block', textWrap: 'balance', wordBreak: 'keep-all', overflowWrap: 'normal', hyphens: 'none', whiteSpace: 'normal' }}>
                    {visibleSubtitle}
                  </span>
                )}
              </div>'''

norm_text = text.replace('\r\n', '\n')
norm_target = target.replace('\r\n', '\n')
norm_rep = replacement.replace('\r\n', '\n')

assert norm_target in norm_text, "target not found"
norm_text = norm_text.replace(norm_target, norm_rep)

with open('frontend/src/features/workspace/components/VideoPreview/VideoPreviewPane.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(norm_text)
print("Updated VideoPreviewPane.tsx successfully!")


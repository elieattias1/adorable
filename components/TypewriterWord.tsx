'use client'

import { useEffect, useRef, useState } from 'react'

const WORDS = [
  'commerce',
  'boulangerie',
  'salon de coiffure',
  'café',
  'restaurant',
  'salon de beauté',
  'librairie',
  'fleuriste',
]

const TYPE_SPEED   = 70
const DELETE_SPEED = 40
const PAUSE_AFTER  = 1800
const PAUSE_BEFORE = 300

export default function TypewriterWord() {
  const [display, setDisplay] = useState(WORDS[0])
  const state = useRef({ wordIdx: 0, charIdx: WORDS[0].length, phase: 'wait' as 'wait' | 'delete' | 'type' })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      const s = state.current
      const word = WORDS[s.wordIdx]

      if (s.phase === 'wait') {
        s.phase = 'delete'
        timer = setTimeout(tick, PAUSE_AFTER)

      } else if (s.phase === 'delete') {
        if (s.charIdx > 0) {
          s.charIdx--
          setDisplay(word.slice(0, s.charIdx))
          timer = setTimeout(tick, DELETE_SPEED)
        } else {
          s.wordIdx = (s.wordIdx + 1) % WORDS.length
          s.phase = 'type'
          timer = setTimeout(tick, PAUSE_BEFORE)
        }

      } else {
        const target = WORDS[s.wordIdx]
        if (s.charIdx < target.length) {
          s.charIdx++
          setDisplay(target.slice(0, s.charIdx))
          timer = setTimeout(tick, TYPE_SPEED)
        } else {
          s.phase = 'wait'
          timer = setTimeout(tick, PAUSE_AFTER)
        }
      }
    }

    timer = setTimeout(tick, PAUSE_AFTER)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span>
      {display}
      <span className="inline-block w-[3px] h-[0.85em] bg-current align-middle ml-0.5 animate-[blink_1s_step-end_infinite]" />
    </span>
  )
}

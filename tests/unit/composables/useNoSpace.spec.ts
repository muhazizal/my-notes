import { describe, it, expect, vi } from 'vitest'
import { useNoSpace } from '../../../composables/utils/input/useNoSpace'

describe('useNoSpace', () => {
  it('calls preventDefault when key is a single space', () => {
    const { preventSpace } = useNoSpace()
    const preventDefault = vi.fn()
    const event = { key: ' ', preventDefault } as unknown as KeyboardEvent

    preventSpace(event)

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  it('does not call preventDefault for non-space keys', () => {
    const { preventSpace } = useNoSpace()
    const preventDefault = vi.fn()
    const eventA = { key: 'a', preventDefault } as unknown as KeyboardEvent
    const eventEnter = { key: 'Enter', preventDefault } as unknown as KeyboardEvent

    preventSpace(eventA)
    preventSpace(eventEnter)

    expect(preventDefault).not.toHaveBeenCalled()
  })
})
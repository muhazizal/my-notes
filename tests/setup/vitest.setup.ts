// Shared Vitest setup: stubs common Nuxt globals and boots MSW.
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRouter', () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }))
vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }))

const server = setupServer(...handlers)
vi.stubGlobal('mswServer', server)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

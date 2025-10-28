import { test as baseTest } from '@playwright/test'
import { createNetworkFixture, type NetworkFixture } from '@msw/playwright'
import { handlers } from '@/tests/helpers/handlers'

interface Fixtures {
	network: NetworkFixture
}

export const test = baseTest.extend<Fixtures>({
	network: createNetworkFixture({
		initialHandlers: handlers,
	}),
})

export { expect } from '@playwright/test'

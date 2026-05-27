import { describe, expect, it } from 'vitest'
import { useAuthStore, type NimbleSession } from '../../../app/stores/auth'

const sampleSession: NimbleSession = {
  token: 'jwt-token',
  authID: 'auth-id',
  clientUrl: 'qa22',
  clientFullUrl: 'https://qa22.nimbleproperty.net',
  userID: 'user-123',
  userName: 'ajay@nimbleaccounting.com',
  urlID: 70029,
  email: 'ajay@nimbleaccounting.com',
}

describe('useAuthStore', () => {
  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.token).toBeNull()
    expect(store.session).toBeNull()
    expect(store.isInitialized).toBe(false)
  })

  it('setSession stores Nimble session and marks initialized', () => {
    const store = useAuthStore()
    store.setSession(sampleSession)

    expect(store.isAuthenticated).toBe(true)
    expect(store.token).toBe('jwt-token')
    expect(store.user?.email).toBe('ajay@nimbleaccounting.com')
    expect(store.isInitialized).toBe(true)
  })

  it('clear resets session state', () => {
    const store = useAuthStore()
    store.setSession(sampleSession)
    store.clear()

    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
    expect(store.isInitialized).toBe(false)
  })
})

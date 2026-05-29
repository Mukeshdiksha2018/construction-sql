import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { NimbleSession } from '../../../app/stores/auth'
import {
  AUTH_PINIA_STORAGE_KEY,
  consumePrintAuthSession,
  readPersistedAuthSession,
  stashPrintAuthSession,
} from '../../../app/utils/printAuthBridge'

const session: NimbleSession = {
  token: 'bridge-token',
  authID: 'auth-1',
  clientUrl: '',
  clientFullUrl: '',
  userID: 'user-1',
  userName: 'Test User',
  urlID: 1,
  email: 'test@example.com',
}

describe('printAuthBridge', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stashes and consumes a one-time print session bridge', () => {
    stashPrintAuthSession(session)

    expect(consumePrintAuthSession()).toEqual(session)
    expect(consumePrintAuthSession()).toBeNull()
  })

  it('reads persisted Pinia auth from localStorage', () => {
    localStorage.setItem(AUTH_PINIA_STORAGE_KEY, JSON.stringify({ session }))

    expect(readPersistedAuthSession()).toEqual(session)
  })
})

import { describe, expect, it, vi } from 'vitest'
import {
  AuthError,
  buildNimbleLoginUrl,
  nimbleLogin,
  parseLoginBody,
  resolveNimbleAuthConfig,
  type NimbleFetch,
} from '../../../server/utils/nimble-auth'

describe('parseLoginBody', () => {
  it('returns trimmed email as userName and password', () => {
    expect(parseLoginBody({ email: '  user@test.com  ', password: 'secret' })).toEqual({
      userName: 'user@test.com',
      password: 'secret',
    })
  })

  it('throws 400 when email is missing', () => {
    expect(() => parseLoginBody({ password: 'secret' })).toThrow(AuthError)
    try {
      parseLoginBody({ password: 'secret' })
    }
    catch (error) {
      expect((error as AuthError).statusCode).toBe(400)
      expect((error as AuthError).message).toBe('Email and password are required')
    }
  })

  it('throws 400 when password is missing', () => {
    expect(() => parseLoginBody({ email: 'user@test.com' })).toThrowError(AuthError)
  })

  it('throws 400 when email is whitespace only', () => {
    expect(() => parseLoginBody({ email: '   ', password: 'x' })).toThrowError(AuthError)
  })
})

describe('resolveNimbleAuthConfig', () => {
  it('strips trailing slash from base URL', () => {
    expect(
      resolveNimbleAuthConfig({
        nimbleOauthExchangeUrl: 'https://qa-api-usermgmt.nimbleproperty.net/',
        nimblePayableEnv: 'qa22',
      }),
    ).toEqual({
      baseUrl: 'https://qa-api-usermgmt.nimbleproperty.net',
      clientUrl: 'qa22',
    })
  })

  it('throws 500 when Nimble env is not configured', () => {
    expect(() => resolveNimbleAuthConfig({})).toThrowError(
      expect.objectContaining({ statusCode: 500 }),
    )
  })
})

describe('buildNimbleLoginUrl', () => {
  it('builds the OpenApiauth login endpoint', () => {
    expect(buildNimbleLoginUrl('https://qa-api-usermgmt.nimbleproperty.net')).toBe(
      'https://qa-api-usermgmt.nimbleproperty.net/v1/OpenApiauth/Login',
    )
  })
})

describe('nimbleLogin', () => {
  const config = {
    baseUrl: 'https://qa-api-usermgmt.nimbleproperty.net',
    clientUrl: 'qa22',
  }

  const credentials = {
    userName: 'ajay@nimbleaccounting.com',
    password: 'Ajay@123',
  }

  const successResponse = {
    token: 'jwt-token',
    authID: 'de9dd80e-7fce-4cb5-a66c-5943e87a1c8d',
    clientUrl: 'qa22',
    clientFullUrl: 'https://qa22.nimbleproperty.net',
    userID: 'F0F79D7D8B0AE9964186192395BF545D0000',
    userName: null,
    urlID: 70029,
    statusCode: 200,
    status: 'OK',
  }

  it('calls Nimble login API with correct payload', async () => {
    const fetchFn = vi.fn<NimbleFetch>().mockResolvedValue(successResponse)

    await nimbleLogin(credentials, config, fetchFn)

    expect(fetchFn).toHaveBeenCalledWith(
      'https://qa-api-usermgmt.nimbleproperty.net/v1/OpenApiauth/Login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          userName: 'ajay@nimbleaccounting.com',
          password: 'Ajay@123',
          url: 'qa22',
        },
      },
    )
  })

  it('returns normalized session on success', async () => {
    const fetchFn = vi.fn<NimbleFetch>().mockResolvedValue(successResponse)

    const result = await nimbleLogin(credentials, config, fetchFn)

    expect(result.session).toEqual({
      token: 'jwt-token',
      authID: 'de9dd80e-7fce-4cb5-a66c-5943e87a1c8d',
      clientUrl: 'qa22',
      clientFullUrl: 'https://qa22.nimbleproperty.net',
      userID: 'F0F79D7D8B0AE9964186192395BF545D0000',
      userName: 'ajay@nimbleaccounting.com',
      urlID: 70029,
      email: 'ajay@nimbleaccounting.com',
    })
  })

  it('throws 401 when statusCode is not 200', async () => {
    const fetchFn = vi.fn<NimbleFetch>().mockResolvedValue({
      statusCode: 401,
      status: 'Unauthorized',
    })

    await expect(nimbleLogin(credentials, config, fetchFn)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    })
  })

  it('throws 401 when token is missing', async () => {
    const fetchFn = vi.fn<NimbleFetch>().mockResolvedValue({
      statusCode: 200,
      status: 'OK',
      userID: 'abc',
    })

    await expect(nimbleLogin(credentials, config, fetchFn)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('maps upstream fetch errors to 401 with message', async () => {
    const fetchFn = vi.fn<NimbleFetch>().mockRejectedValue({
      data: { status: 'Invalid credentials' },
    })

    await expect(nimbleLogin(credentials, config, fetchFn)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  })

  it('re-throws AuthError from fetch layer with statusCode', async () => {
    const fetchFn = vi.fn<NimbleFetch>().mockRejectedValue({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })

    await expect(nimbleLogin(credentials, config, fetchFn)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Forbidden',
    })
  })
})

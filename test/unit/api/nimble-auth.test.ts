import { describe, expect, it, vi } from 'vitest'
import {
  AuthError,
  buildNimbleExchangeOAuthUrl,
  buildNimbleLoginUrl,
  buildNimbleValidateTokenUrl,
  nimbleExchangeOAuth,
  nimbleLogin,
  parseLoginBody,
  resolveNimbleAuthConfig,
  resolveNimbleOAuthConfig,
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

describe('Nimble OAuth URL/config helpers', () => {
  it('builds ExchangeOAuth and ValidateToken endpoints', () => {
    expect(buildNimbleExchangeOAuthUrl('https://qa-api-usermgmt.nimbleproperty.net')).toBe(
      'https://qa-api-usermgmt.nimbleproperty.net/v1/OpenApiauth/ExchangeOAuth',
    )
    expect(buildNimbleValidateTokenUrl('https://qa-api-usermgmt.nimbleproperty.net')).toBe(
      'https://qa-api-usermgmt.nimbleproperty.net/v1/OpenApiauth/ValidateToken',
    )
  })

  it('resolves OAuth config and strips trailing slash', () => {
    expect(
      resolveNimbleOAuthConfig({
        nimbleOauthExchangeUrl: 'https://qa-api-usermgmt.nimbleproperty.net/',
      }),
    ).toEqual({
      baseUrl: 'https://qa-api-usermgmt.nimbleproperty.net',
    })
  })

  it('throws 500 when OAuth base URL is missing', () => {
    expect(() => resolveNimbleOAuthConfig({})).toThrowError(
      expect.objectContaining({ statusCode: 500 }),
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

describe('nimbleExchangeOAuth', () => {
  const config = {
    baseUrl: 'https://qa-api-usermgmt.nimbleproperty.net',
  }

  it('calls exchange + validate and returns normalized session', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        token: 'jwt-token',
        authID: null,
        clientUrl: 'https://qa11.nimbleproperty.net',
        clientFullUrl: null,
        userID: null,
        userName: 'Ajay Babu',
        urlID: 0,
        email: 'ajay@nimbleaccounting.com',
        statusCode: 200,
        status: 'OK',
      })
      .mockResolvedValueOnce({
        userID: '98B42335C6DA998A455165C8BCE169610000',
        clientID: '73A76E78F4BDEC844BFF374DCBD9F3D90000',
        clientName: 'qa11',
        userInfoID: '71150',
        clientInfoID: '80250',
        urlID: '17',
        clientUrl: 'qa11.nimbleproperty.net',
        statusCode: 200,
        status: 'OK',
      })

    const result = await nimbleExchangeOAuth('auth-guid-123', config, fetchFn)

    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      'https://qa-api-usermgmt.nimbleproperty.net/v1/OpenApiauth/ExchangeOAuth',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          token: 'auth-guid-123',
        },
      },
    )
    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      'https://qa-api-usermgmt.nimbleproperty.net/v1/OpenApiauth/ValidateToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          token: 'jwt-token',
        },
      },
    )
    expect(result.session).toEqual({
      token: 'jwt-token',
      authID: 'auth-guid-123',
      clientUrl: 'https://qa11.nimbleproperty.net',
      clientFullUrl: '',
      userID: '98B42335C6DA998A455165C8BCE169610000',
      userName: 'Ajay Babu',
      urlID: 17,
      email: 'ajay@nimbleaccounting.com',
    })
  })

  it('throws 401 when exchange token generation fails', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      statusCode: 401,
      status: 'Unauthorized',
      message: 'Invalid authId',
    })

    await expect(nimbleExchangeOAuth('bad-auth-id', config, fetchFn)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    })
  })

  it('throws 401 when validate token fails', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        token: 'jwt-token',
        statusCode: 200,
        status: 'OK',
      })
      .mockResolvedValueOnce({
        statusCode: 401,
        status: 'Unauthorized',
      })

    await expect(nimbleExchangeOAuth('auth-guid-123', config, fetchFn)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    })
  })

  it('maps upstream fetch rejection with statusCode/statusMessage', async () => {
    const fetchFn = vi.fn().mockRejectedValue({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
    })

    await expect(nimbleExchangeOAuth('auth-guid-123', config, fetchFn)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Service Unavailable',
    })
  })
})

export interface LoginBody {
  email?: string
  password?: string
}

export interface NimbleLoginResponse {
  token?: string
  authID?: string
  clientUrl?: string
  clientFullUrl?: string
  userID?: string
  userName?: string | null
  urlID?: number
  email?: string | null
  statusCode?: number
  status?: string
  message?: string
}

export interface NimbleLoginCredentials {
  userName: string
  password: string
}

export interface NimbleAuthConfig {
  baseUrl: string
  clientUrl: string
}

export interface NimbleOAuthConfig {
  baseUrl: string
}

export interface NimbleSessionPayload {
  token: string
  authID: string
  clientUrl: string
  clientFullUrl: string
  userID: string
  userName: string
  urlID: number
  email: string
}

export type NimbleFetch = (
  url: string,
  init?: {
    method?: string
    headers?: Record<string, string>
    body?: object
  },
) => Promise<NimbleLoginResponse>

export interface NimbleValidateTokenResponse {
  userID?: string
  clientID?: string
  clientName?: string
  userInfoID?: string
  clientInfoID?: string
  urlID?: string | number
  clientUrl?: string
  statusCode?: number
  status?: string
  message?: string
}

export type NimbleFetchGeneric<T> = (
  url: string,
  init?: {
    method?: string
    headers?: Record<string, string>
    body?: object
  },
) => Promise<T>

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function parseLoginBody(body: LoginBody): NimbleLoginCredentials {
  const userName = body.email?.trim()
  const password = body.password

  if (!userName || !password) {
    throw new AuthError(400, 'Email and password are required')
  }

  return { userName, password }
}

export function resolveNimbleAuthConfig(publicConfig: {
  nimbleOauthExchangeUrl?: string
  nimblePayableEnv?: string
}): NimbleAuthConfig {
  const baseUrl = publicConfig.nimbleOauthExchangeUrl?.replace(/\/$/, '')
  const clientUrl = publicConfig.nimblePayableEnv

  if (!baseUrl || !clientUrl) {
    throw new AuthError(
      500,
      'Nimble auth is not configured. Set NUXT_PUBLIC_NIMBLE_OAUTH_EXCHANGE_URL and NUXT_PUBLIC_NIMBLE_PAYABLE_ENV in .env',
    )
  }

  return { baseUrl, clientUrl }
}

export function resolveNimbleOAuthConfig(publicConfig: {
  nimbleOauthExchangeUrl?: string
}): NimbleOAuthConfig {
  const baseUrl = publicConfig.nimbleOauthExchangeUrl?.replace(/\/$/, '')

  if (!baseUrl) {
    throw new AuthError(
      500,
      'Nimble auth is not configured. Set NUXT_PUBLIC_NIMBLE_OAUTH_EXCHANGE_URL in .env',
    )
  }

  return { baseUrl }
}

export function buildNimbleLoginUrl(baseUrl: string): string {
  return `${baseUrl}/v1/OpenApiauth/Login`
}

export function buildNimbleExchangeOAuthUrl(baseUrl: string): string {
  return `${baseUrl}/v1/OpenApiauth/ExchangeOAuth`
}

export function buildNimbleValidateTokenUrl(baseUrl: string): string {
  return `${baseUrl}/v1/OpenApiauth/ValidateToken`
}

export async function nimbleLogin(
  credentials: NimbleLoginCredentials,
  config: NimbleAuthConfig,
  fetchFn: NimbleFetch,
): Promise<{ session: NimbleSessionPayload }> {
  const loginUrl = buildNimbleLoginUrl(config.baseUrl)

  try {
    const response = await fetchFn(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        userName: credentials.userName,
        password: credentials.password,
        url: config.clientUrl,
      },
    })

    if (response.statusCode !== 200 || !response.token || !response.userID) {
      throw new AuthError(401, response.status || 'Invalid email or password')
    }

    return {
      session: {
        token: response.token,
        authID: response.authID ?? '',
        clientUrl: response.clientUrl ?? config.clientUrl,
        clientFullUrl: response.clientFullUrl ?? '',
        userID: response.userID,
        userName: response.userName ?? credentials.userName,
        urlID: response.urlID ?? 0,
        email: credentials.userName,
      },
    }
  }
  catch (error: unknown) {
    if (error instanceof AuthError) {
      throw error
    }

    const fetchError = error as {
      statusCode?: number
      statusMessage?: string
      data?: NimbleLoginResponse
    }

    if (fetchError.statusCode && fetchError.statusMessage) {
      throw new AuthError(fetchError.statusCode, fetchError.statusMessage)
    }

    throw new AuthError(
      401,
      fetchError.data?.status
        || fetchError.data?.message
        || 'Login failed. Please check your credentials and try again.',
    )
  }
}

export async function nimbleExchangeOAuth(
  authId: string,
  config: NimbleOAuthConfig,
  fetchFn: NimbleFetchGeneric<NimbleLoginResponse>,
): Promise<{ session: NimbleSessionPayload }> {
  const exchangeUrl = buildNimbleExchangeOAuthUrl(config.baseUrl)
  const validateUrl = buildNimbleValidateTokenUrl(config.baseUrl)

  try {
    const exchange = await fetchFn(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        token: authId,
      },
    })

    if (exchange.statusCode !== 200 || !exchange.token) {
      throw new AuthError(401, exchange.status || exchange.message || 'Invalid authId')
    }

    const validateFetch = fetchFn as unknown as NimbleFetchGeneric<NimbleValidateTokenResponse>
    const validate = await validateFetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        token: exchange.token,
      },
    })

    if (validate.statusCode !== 200) {
      throw new AuthError(401, validate.status || validate.message || 'Token validation failed')
    }

    return {
      session: {
        token: exchange.token,
        authID: exchange.authID ?? authId,
        clientUrl: exchange.clientUrl ?? validate.clientUrl ?? '',
        clientFullUrl: exchange.clientFullUrl ?? '',
        userID: validate.userID ?? exchange.userID ?? '',
        userName: exchange.userName ?? 'Nimble User',
        urlID: Number(validate.urlID ?? exchange.urlID ?? 0),
        email: exchange.email ?? '',
      },
    }
  }
  catch (error: unknown) {
    if (error instanceof AuthError) {
      throw error
    }

    const fetchError = error as {
      statusCode?: number
      statusMessage?: string
      data?: NimbleLoginResponse | NimbleValidateTokenResponse
    }

    if (fetchError.statusCode && fetchError.statusMessage) {
      throw new AuthError(fetchError.statusCode, fetchError.statusMessage)
    }

    throw new AuthError(
      401,
      String((fetchError.data as { status?: string, message?: string } | undefined)?.status
        || (fetchError.data as { status?: string, message?: string } | undefined)?.message
        || 'OAuth token exchange failed'),
    )
  }
}

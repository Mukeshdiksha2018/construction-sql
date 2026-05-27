interface LoginBody {
  email?: string
  password?: string
}

interface NimbleLoginResponse {
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
}

/**
 * POST /api/auth/login
 * Authenticates via Nimble Open API (uses NUXT_PUBLIC_NIMBLE_OAUTH_EXCHANGE_URL + NUXT_PUBLIC_NIMBLE_PAYABLE_ENV).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const userName = body.email?.trim()
  const password = body.password

  if (!userName || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  const config = useRuntimeConfig()
  const baseUrl = config.public.nimbleOauthExchangeUrl?.replace(/\/$/, '')
  const clientUrl = config.public.nimblePayableEnv

  if (!baseUrl || !clientUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Nimble auth is not configured. Set NUXT_PUBLIC_NIMBLE_OAUTH_EXCHANGE_URL and NUXT_PUBLIC_NIMBLE_PAYABLE_ENV in .env',
    })
  }

  const loginUrl = `${baseUrl}/v1/OpenApiauth/Login`

  try {
    const response = await $fetch<NimbleLoginResponse>(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        userName,
        password,
        url: clientUrl,
      },
    })

    if (response.statusCode !== 200 || !response.token || !response.userID) {
      throw createError({
        statusCode: 401,
        statusMessage: response.status || 'Invalid email or password',
      })
    }

    return {
      session: {
        token: response.token,
        authID: response.authID ?? '',
        clientUrl: response.clientUrl ?? clientUrl,
        clientFullUrl: response.clientFullUrl ?? '',
        userID: response.userID,
        userName: response.userName ?? userName,
        urlID: response.urlID ?? 0,
        email: userName,
      },
    }
  }
  catch (error: unknown) {
    const fetchError = error as {
      statusCode?: number
      statusMessage?: string
      data?: NimbleLoginResponse & { message?: string }
    }

    if (fetchError.statusCode && fetchError.statusMessage) {
      throw error
    }

    throw createError({
      statusCode: 401,
      statusMessage:
        fetchError.data?.status
        || fetchError.data?.message
        || 'Login failed. Please check your credentials and try again.',
    })
  }
})

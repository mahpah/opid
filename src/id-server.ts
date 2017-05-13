import * as Koa from 'koa'
import { Context } from 'koa'
import * as KoaRouter from 'koa-router'
import * as assert from 'assert'
import * as bodyparser from 'koa-bodyparser'
import * as logger from 'koa-logger'
import * as btoa from 'btoa'
import { render } from './utils'
import { Config } from './config'

const RegisteredClients = [{
	clientName: 'DigiMed',
	clientId: 'dgm_1111',
	clientSecret: 'verysecret',
	clientOrigin: '.*'
}]

const ValidCodes = new Map<string, any>()
const app = new Koa()
const router = new KoaRouter()

app.use(bodyparser())

/**
 * Authorize enpoint
 * @method GET
 * Validate query params generate by application server,
 * and send user our login page which super secure by design.
 * @see http://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
router.get('/v1/authorize', async (ctx: Context) => {
	const query = ctx.request.query

	/**
	 * response type is code, tell
	 */
	const responseType = query.response_type
	assert(responseType === 'code', 'response type must be code')

	const scope = query.scope
	assert(typeof scope === 'string', 'scope must be set')

	const scopes: Array<string> = scope.split(/\s/)
	assert(scopes.indexOf('openid') >= 0, 'scope must contains openid')

	const clientId = query.client_id
	assert(typeof clientId === 'string', 'client id is require')

	// must be a valid clientId, which registered to our server before
	const redirectUri = query.redirect_uri
	assert(typeof redirectUri === 'string', 'redirect uri is required')

	/**
	 * prompt indicate the way we authenticate user
	 * - none: throw error if user not logged in or had pre-configured consent
	 * - login: if user not logged in, ask them to do so
	 * - consent: if user not consent, ask them to do so
	 * - select_account: prompt user to select account
	 */
	let prompt = query.prompt
	assert(isValidPrompt(prompt), 'unknown prompt')

	/** We process only login - consent prompt */
	const validClient = RegisteredClients.filter(item => item.clientId === clientId)[0]
	if (validClient) {
		ctx.set('content-type', 'text/html')
		ctx.body = renderLogin({ scopes, clientId })
	}
})

/**
 * Authorization endpoint
 * @method POST
 * Our login form send user credential here. We validate and send user back to application page,
 * using redirectUri they included in query, or body, whatever. This uri must be contained in same origin
 * registed before.
 * We append to this callback url an authorization code, which application will exchange to get id token (and may be access token)
 */
router.post('/v1/authorize', async (ctx: Context) => {
	const { redirect_uri: redirectUri } = ctx.query
	const credential = ctx.request.body

	assert(isValidUser(credential))
	const { nonce, code } = generateAuthorationCode(credential)

	ctx.redirect(`${redirectUri}?code=${code}&nonce=${nonce}`)
})


/**
 * Token endpoit
 * @method POST
 * @content_type: application/x-www-form-urlencoded
 */
router.post('/v1/token', async (ctx: Context) => {
	const postData = ctx.request.body

	const redirectUri = postData.redirect_uri
	assert(typeof redirectUri === 'string', 'Redirect uri missing')

	const grantType = postData.grant_type
	assert(grantType === 'authorization_code', 'grant type missmatched')

	const nonce = postData.nonce
	const code = postData.code
	const { username, clientId } = validateNonceAndCode(nonce, code)

	if (!username) {
		ctx.throw(400, {
			error: ''
		})
	}

	/**
	 * encrypt token id using client secret
	 */
	const clientSecret = RegisteredClients.filter(i => i.clientId === clientId)
		.map(i => i.clientSecret)[0]
	console.log(clientSecret)

	/**
	 * id_token claim, @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
	 */
	const iat = Math.floor(+new Date() / 1000)
	const token = btoa(JSON.stringify({
		iss: 'opid',
		aud: 'dgm_1111',
		sub: username,
		iat,
		exp: iat + 3600,
	}) + clientSecret)
	ctx.set('content-type', 'application/json')
	ctx.body = {
		id_token: token,
		access_token: btoa(JSON.stringify({id: token}))
	}
})

app.use(async (ctx: Context, next: Function) => {
	try {
		await next()
	} catch (e) {
		ctx.throw(e.status || 500, e)
	}
})
app.use(logger())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(Config.idServerPort, () => {
	console.log('Id server listening on port ' + Config.idServerPort)
})

/* Utilities */
function isValidUser(_credential) {
	return true
}

/**
 * generate authorization code
 * assume that btoa is a super secure encrypt algorithm
 */
function generateAuthorationCode(credential) {
	const nonce: number = Date.now()
	const clientId = credential.clientId
	const code = btoa(JSON.stringify(credential) + nonce)
	// save the code and nonce to validate later
	ValidCodes.set(code, {username: credential.username, nonce, clientId})
	return {nonce, code}
}

function validateNonceAndCode(nonce, code) {
	const data = ValidCodes.get(code)
	ValidCodes.set(code, undefined)

	if (!data || data.nonce !== +nonce) {
		return false
	}

	return data
}

function isValidPrompt(prompt: string) {
	if (!prompt) {
		return ['login', 'consent']
	}
	let promptActions: Array<string> = (prompt || '').split(' ')
	let isValid = promptActions.every(action => ['login', 'consent', 'select_account', 'none'].indexOf(action) >= 0)
	return isValid ? promptActions : false
}

function renderLogin(data) {
	let { scopes, clientId } = data
	const clientName = RegisteredClients.filter(it => it.clientId === clientId)
		.map(i => i.clientName)[0]

	scopes = scopes.filter(i => i !== 'openid')
		.map(text => `<li>${text}</li>`)
		.join('')

	const templateData = {
		clientName,
		scopes,
		clientId,
	}
	let template = 'template/login.html'

	return render(template, templateData)
}

import * as Koa from 'koa'
import { Context } from 'koa'
import * as KoaRouter from 'koa-router'
import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import * as bodyparser from 'koa-bodyparser'
import * as logger from 'koa-logger'
import * as btoa from 'btoa'

const RegisteredClients = [{
	clientId: 'dgm_1111',
	clientSecret: 'verysecure',
}]

const ValidCodes = new Map<string, any>()
const app = new Koa()
const router = new KoaRouter()

app.use(bodyparser())

router.get('/v1/authorize', async (ctx: Context) => {
	const {
		response_type: responseType,
		scope,
		client_id: clientId,
		redirect_uri: redirectUri
	} = ctx.query
	console.log(ctx.query)
	assert(responseType === 'code', 'response type must be code')
	assert(typeof redirectUri === 'string', 'redirect uri is required')
	assert(typeof clientId === 'string', 'client id not found')
	assert(typeof scope === 'string', 'scope must be set')

	const validClient = RegisteredClients.filter(item => item.clientId === clientId)[0]
	if (validClient) {
		ctx.set('content-type', 'text/html')
		ctx.body = fs.readFileSync(path.resolve('src/template/login.html'))
	}
})

router.post('/v1/authorize', async (ctx: Context) => {
	const { redirect_uri: redirectUri } = ctx.query
	const credential = ctx.request.body

	// validate credential here

	// sav the code and nonce to validate later
	const nonce = +new Date()
	const code = btoa(JSON.stringify(credential))
	ValidCodes.set(code, {username: credential.username, nonce})
	ctx.redirect(`${redirectUri}?code=${code}&nonce=${nonce}`)
})

router.post('/v1/token', async (ctx: Context) => {
	console.log(ctx.request.body)
	const {
		grant_type: grantType,
		code,
		redirect_uri: redirectUri,
		nonce,
	} = ctx.request.body

	assert(typeof redirectUri === 'string', 'Redirect uri missing')
	assert(grantType === 'authorization_code', 'grant type missmatched')
	const data = ValidCodes.get(code)
	ValidCodes.set(code, undefined)

	if (!data || data.nonce !== +nonce) {
		ctx.throw(400, {
			error: 'invalid request',
		})
		return
	}

	const token = btoa(JSON.stringify({
		iss: 'oeee',
		sub: data.username,
		iat: Math.floor(+new Date() / 1000),
		exp: 3600,
	}))
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

app.listen(3030, () => {
	console.log('Id server listening on port 3030')
})

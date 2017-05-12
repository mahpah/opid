import * as Koa from 'koa'
import { Context } from 'koa'
import * as KoaRouter from 'koa-router'
import * as logger from 'koa-logger'
import * as superagent from 'superagent'

const ClientId = 'dgm_1111'
// const ClientSecret = 'verysecret'
const AuthorizeUrl = 'http://localhost:3030/v1/authorize'
const AuthorizeRedirectUri = 'http://localhost:3000/openid/callback'

const app = new Koa()
const router = new KoaRouter()

router.get('/openid/login', async (ctx: Context) => {
	const location = `${AuthorizeUrl}?response_type=code&client_id=${ClientId}&redirect_uri=${AuthorizeRedirectUri}&scope=profile`
	ctx.redirect(location)
})

router.get('/openid/callback', async (ctx: Context) => {
	const { code, nonce } = ctx.request.query
	console.log(code, nonce)

	try {
		const tokenResponse = await superagent.post('http://localhost:3030/v1/token')
			.set('Content-type', 'application/json') // should be form url encoded
			.send({
				grant_type: 'authorization_code',
				code,
				redirect_uri: AuthorizeRedirectUri,
				nonce,
			})
		ctx.body = {
			tokenResponse: tokenResponse.body,
		}
	} catch (e) {
		ctx.body = e
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

app.listen(3000, () => {
	console.log('Application server listening on port 3000')
})

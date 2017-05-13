/**
 * RELYING PARTY or CLIENT
 * This application rely on identity provided by OpenID server. That why it's called so
 */

import * as Koa from 'koa'
import { Context } from 'koa'
import * as KoaRouter from 'koa-router'
import * as logger from 'koa-logger'
import * as superagent from 'superagent'
import { render } from './utils'
import * as atob from 'atob'
import * as assert  from 'assert'
import { Config } from './config'

const ClientId = 'dgm_1111'
const ClientSecret = 'verysecret'
const AuthorizeUrl = `${Config.idServer}/v1/authorize`
const TokenUrl = `${Config.idServer}/v1/token`
const AuthorizeRedirectUri = `${Config.applicationServer}/openid/callback`

const app = new Koa()
const router = new KoaRouter()

/**
 * take user to login page provided by open id provider
 */
router.get('/openid/login', async (ctx: Context) => {
	const scopes = encodeURIComponent(['openid', 'profile', 'email'].join(' '))
	const location =
		`${AuthorizeUrl}?response_type=code&client_id=${ClientId}&redirect_uri=${AuthorizeRedirectUri}&scope=${scopes}`
	ctx.redirect(location)
})

/**
 * after user authenticate and authorize in openid page, it (openid server) will send them back here
 */
router.get('/openid/callback', async (ctx: Context) => {
	const { code, nonce } = ctx.request.query

	try {
		const tokenResponse = await superagent.post(TokenUrl)
			.set('Content-type', 'application/json') // should be form url encoded
			.send({
				grant_type: 'authorization_code',
				code,
				redirect_uri: AuthorizeRedirectUri,
				nonce,
			})

		ctx.status = tokenResponse.status

		if (tokenResponse.status !== 200) {
			ctx.body = {
				tokenResponse: tokenResponse.body,
			}
			return
		}

		/**
		 * Relying party could decrypt token to verify it
		 * @see http://openid.net/specs/openid-connect-core-1_0.html#TokenResponseValidation
		 */
		const idToken = tokenResponse.body.id_token
		const plain = atob(idToken).replace(ClientSecret, '')
		const claim = JSON.parse(plain)
		assert(claim, 'claim must be defined')
		assert(claim.aud === ClientId, 'claim must belong to us')
		// render some welcome page, if you want
		ctx.body = render('template/callback-page.html', {
			username: claim.sub
		})

	} catch (e) {
		console.log(e)
		ctx.throw(401, e.response)
	}
})

router.get('*', async ctx => {
	ctx.body = render('template/application.html', { })
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

app.listen(Config.applicationServerPort, () => {
	console.log('Application server listening on port ' + Config.applicationServerPort)
})

import * as fs from 'fs'
import { resolve } from 'path'

export function render(templatePath, templateData) {
	let template = fs.readFileSync(resolve(__dirname, templatePath)).toString('utf8')
	template = template.replace(/\{\{([^\}]+)\}\}/g, (_, key) => {
		return templateData[key]
	})

	return template
}

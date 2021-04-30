const puppeteer = require('puppeteer');
const express = require('express')
const app = express()
const port = 8000
let browser = null;
(async () => {
    browser = await puppeteer.launch({ headless: true,  args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ] });
    app.get('/', async (req, res) => {
            const login = req.query.login
            const password = req.query.password
            const endpoint = req.query.endpoint
            if (login && password && endpoint) {
                try {
                    const token = await auth(endpoint, login, password);
                    res.send({token});
                } catch(e){
                    res.status(403).send({"error": e.message});
                }
            } else {
                res.statusCode = 400;
                res.status(400).send({"error":"wrong request"})
            }
      })
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`)
    })

})()

async function auth(endpoint, login, password) {
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.goto(endpoint, { waitUntil: 'domcontentloaded' });
    console.log("authentification for " + login + " at " + endpoint)
    await page.evaluate((a, b) => {
        document.querySelector('#userfield').value = a;
        document.querySelector('#passwordfield').value = b;
        document.querySelector('#sign_in_button').click();
    }, login, password);
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    const url = await page.url();
    if (url.indexOf('token') > -1) {
        context.close();
        return url.split('token=')[1].split('&')[0]
    } else {
        context.close();
        throw new Error("Forbidden")
    }
};




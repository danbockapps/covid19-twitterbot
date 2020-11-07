import puppeteer from 'puppeteer'
import { sendPictureTweet, uploadPicture } from './tweet'

export const runScreenshot = async () => {
  const path = `/tmp/${new Date().toISOString()}.png`
  await downloadScreenshot(path)

  console.time('upload')
  const mediaId = await uploadPicture(path)
  console.timeEnd('upload')

  console.time('send')
  await sendPictureTweet(
    `Here's the latest from the NC DHHS COVID-19 dashboard.
  
https://covid19.ncdhhs.gov/dashboard`,
    mediaId,
  )
  console.timeEnd('send')
}

export const downloadScreenshot = async (path: string) => {
  console.time('launch')
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  console.timeEnd('launch')

  console.time('newPage')
  const page = await browser.newPage()
  page.setViewport({ width: 1000, height: 1000 })
  console.timeEnd('newPage')

  console.time('goto')
  await page.goto(
    'https://public.tableau.com/views/NCDHHS_COVID-19_Dashboard_Summary/NCDHHS_DASHBOARD_SUMMARY',
  )
  console.timeEnd('goto')

  console.time('selector')
  await page.waitForSelector('#tab-dashboard-region')
  console.timeEnd('selector')

  // Wait for the spinner to go away
  await new Promise(r => setTimeout(r, 100))

  console.time('href')
  const href = await page.$('#tab-dashboard-region')
  console.timeEnd('href')

  console.time('screenshot')
  href && (await href.screenshot({ path }))
  console.timeEnd('screenshot')

  console.time('close')
  await browser.close()
  console.timeEnd('close')
}

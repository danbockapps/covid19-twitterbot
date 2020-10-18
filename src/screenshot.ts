import puppeteer from 'puppeteer'
import { uploadPicture } from './tweet'

export const runScreenshot = async () => {
  const path = `tmp/${new Date().toISOString()}.png`
  await downloadScreenshot(path)

  const result = await uploadPicture(path)
  console.log(result)
}

const downloadScreenshot = async (path: string) => {
  console.time('launch')
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.setViewport({ width: 2000, height: 4000, deviceScaleFactor: 4 })
  console.timeEnd('launch')

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

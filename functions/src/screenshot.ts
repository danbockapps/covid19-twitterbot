import puppeteer from 'puppeteer'

export const downloadScreenshot = async (path: string) => {
  console.log('Launching puppeteer...')
  console.time('launch')
  const browser = await puppeteer.launch()
  console.timeEnd('launch')

  console.log('Awaiting browser.newPage()...')
  console.time('newPage')
  const page = await browser.newPage()
  console.timeEnd('newPage')

  console.log('Setting viewport...')
  console.time('setViewport')
  page.setViewport({ width: 2000, height: 4000, deviceScaleFactor: 4 })
  console.timeEnd('setViewport')

  console.log('Goto page...')
  console.time('goto')
  await page.goto(
    'https://public.tableau.com/views/NCDHHS_COVID-19_Dashboard_Summary/NCDHHS_DASHBOARD_SUMMARY',
  )
  console.timeEnd('goto')

  console.log('Waiting for selector...')
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

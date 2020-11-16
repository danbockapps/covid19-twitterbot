import { LocalDate } from '@js-joda/core'
import puppeteer, { Browser, Page } from 'puppeteer'
import { dateExistsInFirestore, insertDataIntoFirestore } from './firestore'
import { sendPictureTweet, uploadPicture } from './tweet'

export const runScreenshot = async () => {
  let browser!: Browser
  try {
    console.time('launch')
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    console.timeEnd('launch')

    console.time('newPage')
    const page = await browser.newPage()
    page.setViewport({ width: 1000, height: 1000 })
    console.timeEnd('newPage')

    await checkDateAndRun(page)
  } catch (e) {
    console.error(e)
  } finally {
    console.time('close')
    await browser.close()
    console.timeEnd('close')
  }
}

const checkDateAndRun = async (page: Page) => {
  console.time('goto')
  await page.goto(
    'https://public.tableau.com/views/NCDHHS_COVID-19_Dashboard_Summary/NCDHHS_DASHBOARD_SUMMARY',
  )
  console.timeEnd('goto')

  console.time('selector')
  await page.waitForSelector('#tab-dashboard-region')
  console.timeEnd('selector')

  console.time('outer handle')
  const outerHandle = await page.$x("//span[contains(text(),'Last updated')]")
  console.timeEnd('outer handle')

  console.time('inner handle')
  const innerHandle = await outerHandle[0].getProperty('innerHTML')
  console.timeEnd('inner handle')

  console.time('value')
  const updated = (await innerHandle.jsonValue()) as string
  console.timeEnd('value')

  console.time('dateExistsInFirestore')
  const dateExists = await dateExistsInFirestore(getDateFromLastUpdate(updated), 'ncdhhs')
  console.timeEnd('dateExistsInFirestore')

  if (!dateExists) {
    console.log('Date not found in Firestore.')

    // Wait for the spinner to go away
    // await new Promise(r => setTimeout(r, 100))

    console.time('href')
    const href = await page.$('#tab-dashboard-region')
    console.timeEnd('href')

    const path = `/tmp/${new Date().toISOString()}.png`

    console.time('screenshot')
    href && (await href.screenshot({ path }))
    console.timeEnd('screenshot')

    console.time('upload')
    const mediaId = await uploadPicture(path)
    console.timeEnd('upload')

    // Start testing screenshot

    console.time('goto')
    await page.goto(
      'https://public.tableau.com/views/NCDHHS_COVID-19_Dashboard_Testing_County/NCDHHS_Dashboard_TESTING',
    )
    console.timeEnd('goto')

    console.time('selector')
    await page.waitForSelector('#tab-dashboard-region')
    console.timeEnd('selector')

    console.time('href')
    const href2 = await page.$('#tab-dashboard-region')
    console.timeEnd('href')

    const path2 = `/tmp/${new Date().toISOString()}.png`

    console.time('screenshot')
    href2 && (await href2.screenshot({ path: path2 }))
    console.timeEnd('screenshot')

    console.time('upload')
    const mediaId2 = await uploadPicture(path2)
    console.timeEnd('upload')

    console.time('send')
    const response = await sendPictureTweet(
      `The state just posted the daily update to its COVID-19 dashboard.
    
https://covid19.ncdhhs.gov/dashboard`,
      [mediaId, mediaId2],
    )
    console.timeEnd('send')

    console.time('log')
    await insertDataIntoFirestore(LocalDate.now().toString(), 'ncdhhs', response.id_str)
    console.timeEnd('log')
  } else console.log('Date already in Firestore.')
}

const getDateFromLastUpdate = (value: string) => {
  const dateStart = value.indexOf('Last updated ') + 13
  const dateEnd = value.indexOf('2020') + 4
  const longDate = value.substring(dateStart, dateEnd)
  return new Date(longDate).toISOString().substr(0, 10)
}

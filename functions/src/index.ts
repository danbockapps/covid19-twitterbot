import * as functions from 'firebase-functions'
import { runCdcVaccinations } from './cdcvaccinations'
import { runCounties } from './counties'
import { runNyt } from './functions'
import { runScreenshot } from './screenshot'
import { runVaxDayRank } from './vaxDayRank'

const NY = 'America/New_York'

export const screenshot = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('30 12,14 * * *')
  .timeZone(NY)
  .onRun(runScreenshot)

export const nyt = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('0 1,3,5,6,7,8,9,11,13,15,17,19,23 * * *')
  .timeZone(NY)
  .onRun(runNyt)

export const cdcVaccinations = functions.pubsub
  .schedule('5,20,35,50 8,9,10,11,12,13,14,15,16,17,18,19 * * *')
  .timeZone(NY)
  .onRun(() => runCdcVaccinations('US', 'cdcv', '💉 COVID-19 VACCINATIONS (USA) 🇺🇸'))

export const cdcVaccinationsNc = functions.pubsub
  .schedule('10,25,40,55 8,9,10,11,12,13,14,15,16,17,18,19 * * *')
  .timeZone(NY)
  .onRun(() => runCdcVaccinations('NC', 'cdcv_nc', '💉 COVID-19 VACCINATIONS (NC) 🌲'))

export const vaxDayRank = functions.firestore.document('vax-progress/{id}').onCreate(snap => {
  const data = snap.data()
  if (data.source === 'cdcv_nc') {
    console.log('Running runVaxDayRank. ' + JSON.stringify(data))
    return runVaxDayRank(data.Date)
  } else {
    console.log('Not running runVaxDayRank. ' + JSON.stringify(data))
    return 0
  }
})

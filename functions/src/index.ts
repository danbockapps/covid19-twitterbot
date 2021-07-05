import * as functions from 'firebase-functions'
import { runCdcVaccinations } from './cdcvaccinations'
import { runCounties } from './counties'
import { runPopulateCountyRates } from './functions'
import { runScreenshot } from './screenshot'
import { runVaxDayRank } from './vaxDayRank'

const NY = 'America/New_York'

export const screenshot = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('30 12,14 * * Mon,Tue,Wed,Thu,Fri')
  .timeZone(NY)
  .onRun(runScreenshot)

// June 2021 - this is adhoc for now
// export const nyt = functions
//   .runWith({ memory: '2GB' })
//   .pubsub.schedule('0 0,1,3,5,6,7 * * *')
//   .timeZone(NY)
//   .onRun(runNyt)

export const populateCountyRates = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('44 * * * *')
  .timeZone(NY)
  .onRun(runPopulateCountyRates)

export const counties = functions.pubsub.schedule('45 * * * *').timeZone(NY).onRun(runCounties)

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

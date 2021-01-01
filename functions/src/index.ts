import * as functions from 'firebase-functions'
import { runCdcVaccinations } from './cdcvaccinations'
import { runCounties } from './counties'
import { runNyt } from './functions'
import { runProjectedDate } from './projectedDate'
import { runScreenshot } from './screenshot'

const NY = 'America/New_York'

export const screenshot = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('*/15 11,12,13 * * *')
  .timeZone(NY)
  .onRun(runScreenshot)

export const nyt = functions.pubsub
  .schedule('*/10 0,1,2,3,4,5,6,7,8,9,10,14,15,16,17,18,19,20,21,22,23 * * *')
  .timeZone(NY)
  .onRun(runNyt)

export const counties = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('0 6 * * *')
  .timeZone(NY)
  .onRun(runCounties)

export const cdcVaccinations = functions.pubsub
  .schedule('5,20,35,50 8,9,10,11,12,13,14,15,16,17,18,19 * * *')
  .timeZone(NY)
  .onRun(() => runCdcVaccinations('US', 'cdcv', '💉 COVID-19 VACCINATIONS (USA) 🇺🇸'))

export const cdcVaccinationsNc = functions.pubsub
  .schedule('10,25,40,55 8,9,10,11,12,13,14,15,16,17,18,19 * * *')
  .timeZone(NY)
  .onRun(() => runCdcVaccinations('NC', 'cdcv_nc', '💉 COVID-19 VACCINATIONS (NC) 🌲'))

export const projectedDate = functions.pubsub
  .schedule('0 20 * * 1,3,5')
  .timeZone(NY)
  .onRun(runProjectedDate)

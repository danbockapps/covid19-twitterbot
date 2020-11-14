import * as functions from 'firebase-functions'
import { runCounties } from './counties'
import { runNyt } from './functions'
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
  .pubsub.schedule('0 9 * * *')
  .timeZone(NY)
  .onRun(runCounties)

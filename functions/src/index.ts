import * as functions from 'firebase-functions'
import { runNyt } from './functions'
import { runScreenshot } from './screenshot'

export const screenshot = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('*/15 11,12,13 * * *')
  .timeZone('America/New_York')
  .onRun(runScreenshot)

export const nyt = functions.pubsub
  .schedule('*/10 0,1,2,3,4,5,6,7,8,9,10,14,15,16,17,18,19,20,21,22,23 * * *')
  .timeZone('America/New_York')
  .onRun(runNyt)

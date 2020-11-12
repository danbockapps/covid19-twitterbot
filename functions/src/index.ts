import * as functions from 'firebase-functions'
import { runNyt } from './functions'
import { runScreenshot } from './screenshot'

export const screenshot = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('*/15 11,12,13 * * *')
  .timeZone('America/New_York')
  .onRun(runScreenshot)

export const nyt = functions.pubsub.schedule('*/10 * * * *').onRun(runNyt)

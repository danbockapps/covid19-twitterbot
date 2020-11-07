import * as functions from 'firebase-functions'
import { runScreenshot } from './screenshot'

export const screenshot = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('33 12 2 11 *')
  .timeZone('America/New_York')
  .onRun(runScreenshot)

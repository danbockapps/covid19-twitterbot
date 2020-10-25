import * as functions from 'firebase-functions'
import { downloadScreenshot } from './screenshot'

export const screenshot = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .pubsub.schedule('27 16 * * *')
  .timeZone('America/New_York')
  .onRun(() => downloadScreenshot('tmp/downloaded_image.png'))

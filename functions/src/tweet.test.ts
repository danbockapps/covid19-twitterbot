import { sendTweet } from './tweet'
import Twitter = require('twitter-lite')

jest.mock('twitter-lite')

it('sends tweet', async () => {
  await sendTweet('test tweet')
  expect(Twitter).toHaveBeenCalledTimes(1)

  // This is the least-bad way I could figure out how to do this.
  // Other option is @ts-ignore.
  const twitterInstance = ((Twitter as unknown) as jest.Mock).mock.instances[0]
  expect(twitterInstance.post).toHaveBeenCalledWith('statuses/update', {
    status: 'test tweet',
  })
})

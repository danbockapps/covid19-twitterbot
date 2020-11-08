import fs from 'fs'
import OldTwitter, { AccessTokenOptions } from 'twitter'
import Twitter from 'twitter-lite'
import config from './config'

let twitter: Twitter
let oldTwitter: OldTwitter

if (config.API_KEY && config.API_SECRET_KEY && config.ACCESS_TOKEN && config.ACCESS_TOKEN_SECRET) {
  const options: AccessTokenOptions = {
    consumer_key: config.API_KEY,
    consumer_secret: config.API_SECRET_KEY,
    access_token_key: config.ACCESS_TOKEN,
    access_token_secret: config.ACCESS_TOKEN_SECRET,
  }
  twitter = new Twitter(options)
  oldTwitter = new OldTwitter(options)
} else throw 'config variables not found'

export const sendTweet = async (status: string) => {
  const result = await twitter.post('statuses/update', { status })
  return result
}

export const sendPictureTweet = async (
  status: string,
  mediaId: string,
): Promise<{ id_str: string }> =>
  await twitter.post('statuses/update', { status, media_ids: mediaId })

export const uploadPicture = async (path: string): Promise<string> =>
  new Promise((resolve, reject) => {
    oldTwitter.post('media/upload', { media: fs.readFileSync(path) }, (error, media) => {
      if (error) reject(error)
      else resolve(media.media_id_string)
    })
  })

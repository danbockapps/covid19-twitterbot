const dotenv = require('dotenv')
import fs from 'fs'
import OldTwitter, { AccessTokenOptions } from 'twitter'
import Twitter from 'twitter-lite'

dotenv.config()

let twitter: Twitter
let oldTwitter: OldTwitter

if (
  process.env.API_KEY &&
  process.env.API_SECRET_KEY &&
  process.env.ACCESS_TOKEN &&
  process.env.ACCESS_TOKEN_SECRET
) {
  const options: AccessTokenOptions = {
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token_key: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  }
  twitter = new Twitter(options)
  oldTwitter = new OldTwitter(options)
} else throw 'process.env variables not found'

export const sendTweet = async (status: string) => {
  const result = await twitter.post('statuses/update', { status })
  return result
}

export const sendPictureTweet = async (status: string, mediaId: string) =>
  await twitter.post('statuses/update', { status, media_ids: mediaId })

export const uploadPicture = async (path: string): Promise<string> =>
  new Promise((resolve, reject) => {
    oldTwitter.post(
      'media/upload',
      { media: fs.readFileSync(path) },
      (error, media) => {
        if (error) reject(error)
        else resolve(media.media_id_string)
      },
    )
  })

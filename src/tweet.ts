const dotenv = require('dotenv')
import Twitter, { TwitterOptions } from 'twitter-lite'
import fs from 'fs'

dotenv.config()

let twitter: Twitter
let uploadTwitter: Twitter

if (
  process.env.API_KEY &&
  process.env.API_SECRET_KEY &&
  process.env.ACCESS_TOKEN &&
  process.env.ACCESS_TOKEN_SECRET
) {
  const options: TwitterOptions = {
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token_key: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  }
  twitter = new Twitter(options)
  uploadTwitter = new Twitter({ ...options, subdomain: 'upload' })
} else throw 'process.env variables not found'

export const sendTweet = async (status: string) => {
  const result = await twitter.post('statuses/update', { status })
  return result
}

export const uploadPicture = async (media: string) => {
  try {
    const file = fs.readFileSync(media)
    const result = await uploadTwitter.post('media/upload', { media: file })
    return result
  } catch (error) {
    console.log('There was an error.', error)
  }
}

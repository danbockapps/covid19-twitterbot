import { CdcDataPoint } from './cdcvaccinations'
import { getLatest, insertDataIntoFirestore } from './firestore'
import { formatWithCommas, Tweet } from './functions'
import { sendTweet } from './tweet'

export const runDistribution = async (data: CdcDataPoint) => {
  const previousTweetId = await getLatest('dist')

  console.log('previousTweetId', previousTweetId)

  if (data.Distributed_Pfizer && data.Distributed_Moderna && data.Distributed_Janssen) {
    const tweet: Tweet = await sendTweet(
      getTweetText(data.Distributed_Pfizer, data.Distributed_Moderna, data.Distributed_Janssen),
      previousTweetId,
    )

    await insertDataIntoFirestore(data.Date, 'dist', tweet.id_str)
  }
}

const getTweetText = (
  pfizer: number,
  moderna: number,
  janssen: number,
) => `🚚 VACCINE DISTRIBUTION (USA) 🚚

${getDatapoint('Pfizer', pfizer, 120000000)}

${getDatapoint('Moderna', moderna, 100000000)}

${getDatapoint('Johnson & Johnson', janssen, 20000000)}`

const getDatapoint = (name: string, dist: number, goal: number) =>
  `${name}:
${formatWithCommas(dist)} doses distributed. (${Math.round((dist * 100) / goal)}% of March 31 goal)`

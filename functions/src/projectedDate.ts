import { LocalDate } from '@js-joda/core'
import { CdcDataPoint, getDose1Count } from './cdcvaccinations'
import { roundOff } from './counties'
import { get7daysAgo, getLatest, insertDataIntoFirestore } from './firestore'
import { Tweet } from './functions'
import { sendTweet } from './tweet'

export const runProjectedDate = async (data: CdcDataPoint) => {
  console.log('data for runProjectedDate', JSON.stringify(data))

  const ad1 = getDose1Count(data)

  if (data && data.Date && ad1 && data.Census2019) {
    const [previousTweetId, dose1lastWeek] = await Promise.all([
      (async () => await getLatest('projected'))(),
      (async () => await get7daysAgo(data.Date))(),
    ])

    console.log('Previous tweet: ' + previousTweetId)
    console.log('dose1lastWeek', dose1lastWeek)

    if (previousTweetId && dose1lastWeek) {
      const tweet: Tweet = await sendTweet(
        getTweetText(LocalDate.parse(data.Date), ad1, dose1lastWeek, data.Census2019),
        previousTweetId,
      )

      await insertDataIntoFirestore(data.Date, 'projected', tweet.id_str)
    } else console.log('No previous tweet or no dose 1 last week.')
  } else console.log('Something is wrong with the data.')
}

export const getTweetText = (
  date: LocalDate,
  dose1now: number,
  dose1lastWeek: number,
  totalPop: number,
): string => {
  const pctVax = dose1now / totalPop
  const pctVaxPastWeek = (dose1now - dose1lastWeek) / totalPop
  const pastWeekString = `${roundOff2sigdig(pctVaxPastWeek * 100)}%`

  const pctToGo = 0.6 - pctVax
  const numWeeksToGo = pctToGo / pctVaxPastWeek
  const projectedDate = new Date(
    date.plusDays(Math.round(numWeeksToGo * 7) + 1).toString(),
  ).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return `In the past 7 days, ${pastWeekString} of the population of North Carolina received the first dose of the vaccine, bringing the total to ${roundOff(
    pctVax * 100,
  )}%.

If we continue at ${pastWeekString} per week, we will reach 60% of the population of the state on ${projectedDate}.`
}

const roundOff2sigdig = (n: number) => Math.round(n * 100) / 100

import { ChronoUnit, DateTimeFormatter, LocalDate } from '@js-joda/core'
import { getCdcData } from './cdcvaccinations'
import { roundOff } from './counties'
import { getLatest, insertDataIntoFirestore } from './firestore'
import { Tweet } from './functions'
import { sendTweet } from './tweet'

const START_DATE = LocalDate.of(2020, 12, 14)

export const runProjectedDate = async () => {
  const cdcData = await getCdcData()
  const data = cdcData.vaccination_data.find(d => d.Location === 'NC')
  console.log('data', JSON.stringify(data))

  if (data && data.Date && data.Doses_Administered && data.Census2019) {
    const previousTweetId = await getLatest('projected')
    console.log('Previous tweet: ' + previousTweetId)

    const tweet: Tweet = await sendTweet(
      getTweetText(data.Doses_Administered, data.Census2019),
      previousTweetId,
    )

    await insertDataIntoFirestore(data.Date, 'projected', tweet.id_str)
  } else console.log('Something is wrong with the data.')
}

const getTweetText = (numPeopleVax: number, totalPop: number): string => {
  const pctVax = numPeopleVax / totalPop

  const numDaysSoFar = START_DATE.until(LocalDate.now(), ChronoUnit.DAYS)

  const numDaysTotalEst = totalPop / (numPeopleVax / numDaysSoFar)
  const projectedDate = new Date(
    START_DATE.plusDays(Math.round(numDaysTotalEst * 0.6) + 1).toString(),
  ).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return `In the ${numDaysSoFar} days since COVID-19 vaccinations started, ${roundOff(
    pctVax * 100,
  )}% of the population of North Carolina has received the first dose.

At that rate, we will reach 60% of the population of the state on ${projectedDate}.`
}

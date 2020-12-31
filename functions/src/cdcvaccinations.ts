import Axios from 'axios'
import { dateExistsInFirestore, getLatest, insertDataIntoFirestore } from './firestore'
import { formatWithCommas, Tweet } from './functions'
import { sendTweet } from './tweet'

export interface CdcDataPoint {
  Date: string
  Location: string
  Doses_Distributed: number
  Doses_Administered: number
}

export const runCdcVaccinations = async () => {
  const rawData = await getCdcData()

  const data = rawData.vaccination_data.find(d => d.Location === 'US')
  console.log('data', data)

  if (data && data.Date && data.Doses_Distributed && data.Doses_Administered) {
    const exists = await dateExistsInFirestore(data.Date, 'cdcv')

    if (!exists) {
      console.log(`Date ${data.Date} does not exist in Firestore. Tweeting...`)

      const previousTweetId = await getLatest('cdcv')
      console.log('Previous tweet: ' + previousTweetId)

      const tweet: Tweet = await sendTweet(
        getTweetText(data.Date, data.Doses_Distributed, data.Doses_Administered),
        previousTweetId,
      )

      console.log('Saving date...')

      await insertDataIntoFirestore(data.Date, 'cdcv', tweet.id_str)
    } else console.log(`We already tweeted for ${data.Date}.`)
  } else console.log('Data is not usable.')
}

const getCdcData = async () => {
  const response = await Axios.get<{ vaccination_data: CdcDataPoint[] }>(
    'https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data',
  )
  return response.data
}

const getTweetText = (date: string, dosesDistributed: number, dosesAdministered: number) => `
💉 COVID-19 VACCINATIONS (USA) 🇺🇸

${formatWithCommas(dosesDistributed)} doses distributed
${formatWithCommas(dosesAdministered)} doses administered

Source: CDC, ${date}
`

import Axios from 'axios'
import {
  dateExistsInFirestore,
  getLatest,
  insertDataIntoFirestore,
  insertVaxProgress,
} from './firestore'
import { formatWithCommas, Source, Tweet } from './functions'
import { runProjectedDate } from './projectedDate'
import { sendTweet } from './tweet'

export interface CdcDataPoint {
  Date: string
  Location: string
  Doses_Distributed: number
  Doses_Administered: number
  Administered_Dose1?: number
  Administered_Dose2?: number
  Administered_Dose1_Recip?: number
  Administered_Dose2_Recip?: number
  Census2019: number
  Distributed_Moderna: number
  Distributed_Pfizer: number
  Distributed_Janssen: number
  Series_Complete_Moderna: number
  Series_Complete_Pfizer: number
  Series_Complete_Yes: number
}

export const runCdcVaccinations = async (location: string, source: Source, headline: string) => {
  const rawData = await getCdcData()

  const data = rawData.vaccination_data.find(d => d.Location === location)
  console.log('data', JSON.stringify(data))

  if (data && data.Date && data.Doses_Distributed && data.Doses_Administered) {
    const exists = await dateExistsInFirestore(data.Date, source)

    if (!exists) {
      console.log(`Date ${data.Date} does not exist in Firestore. Tweeting...`)

      const previousTweetId = await getLatest(source)
      console.log('Previous tweet: ' + previousTweetId)

      let ad1 = getDose1Count(data)
      let sc = getSeriesComplete(data)

      if (ad1 && sc) {
        console.log(getTweetText(data.Date, data.Doses_Distributed, ad1, sc, headline))
        const tweet: Tweet = await sendTweet(
          getTweetText(data.Date, data.Doses_Distributed, ad1, sc, headline),
          previousTweetId,
        )

        console.log('Saving date...')

        await Promise.all([
          insertDataIntoFirestore(data.Date, source, tweet.id_str),
          insertVaxProgress(data, source),
        ])

        if (location === 'NC') await runProjectedDate(data)
      } else console.error('No ad1 or no ad2')
    } else console.log(`We already tweeted for ${data.Date}.`)
  } else console.log('Data is not usable.')
}

export const getDose1Count = (data: CdcDataPoint) =>
  data.Administered_Dose1 ||
  data.Doses_Administered - data.Series_Complete_Moderna - data.Series_Complete_Pfizer

export const getSeriesComplete = (data: CdcDataPoint) =>
  data.Administered_Dose2 || data.Series_Complete_Yes

export const getCdcData = async () => {
  const response = await Axios.get<{ vaccination_data: CdcDataPoint[] }>(
    'https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data',
  )
  return response.data
}

const getTweetText = (
  date: string,
  dosesDistributed: number,
  administeredDose1: number,
  seriesComplete: number,
  headline: string,
) => `${headline}

${formatWithCommas(dosesDistributed)} doses distributed
${formatWithCommas(administeredDose1)} first doses administered
${formatWithCommas(seriesComplete)} people fully vaccinated

Source: CDC, ${date}
`

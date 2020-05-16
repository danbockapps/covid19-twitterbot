import { LocalDate } from '@js-joda/core'
import axios from 'axios'
import Papa from 'papaparse'
import { dateExistsInDb, insertDataIntoDb } from './dynamodb'
import { sendTweet } from './tweet'

export const run = async () => {
  if (!process.env.STATE) {
    throw 'STATE not found in env variables.'
  }

  console.log('Getting data...')
  const stateData = await getStateData(process.env.STATE)

  console.log(`${stateData.length} rows. Calculating max date...`)
  const maxDate = getMaxDate(stateData)

  console.log(`Max date is ${maxDate}. Checking database...`)
  const exists = await dateExistsInDb(maxDate)

  if (exists) {
    console.log('Date already exists in database. No new tweet.')
  } else {
    console.log('Date not found in database. Sending tweet...')
    const tweet: Tweet = await sendTweet(getStateTweetText(stateData))

    console.log('Updating database...')
    await insertDataIntoDb(maxDate, tweet.id_str)
  }
}

const getData = () =>
  axios
    .get<string>(
      'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv',
    )
    .then(response => Papa.parse(response.data, { header: true }).data)

export const getStateData: (state: string) => Promise<StateDay[]> = state =>
  getData().then(data =>
    data
      .filter((row: RawStateDay) => row.state === state)
      .map((row: RawStateDay) => ({
        ...row,
        date: LocalDate.parse(row.date),
        cases: Number(row.cases),
        deaths: Number(row.deaths),
      })),
  )

export const getStateTweetText = (data: StateDay[]) => {
  return `Updated data for ${data[0].state}:

Cases
${formatWithCommas(getDayMetric(data, 'cases', 1))}: Now
${formatWithCommas(getDayMetric(data, 'cases', 2))}: Yesterday
${formatWithCommas(getDayMetric(data, 'cases', 8))}: 7 days ago
${formatWithCommas(getDayMetric(data, 'cases', 31))}: 30 days ago

Deaths
${formatWithCommas(getDayMetric(data, 'deaths', 1))}: Now
${formatWithCommas(getDayMetric(data, 'deaths', 2))}: Yesterday
${formatWithCommas(getDayMetric(data, 'deaths', 8))}: 7 days ago
${formatWithCommas(getDayMetric(data, 'deaths', 31))}: 30 days ago
`
}

export const getDayMetric: (
  data: StateDay[],
  metric: 'cases' | 'deaths',
  daysSince: number,
) => number = (data, metric, daysSince) => {
  const row: StateDay | undefined = data.find(element =>
    element.date.equals(LocalDate.now().minusDays(daysSince)),
  )
  return row ? row[metric] : 0
}

export const getMaxDate = (stateDays: StateDay[]) =>
  stateDays
    .reduce((prev, curr) => (prev.date.isAfter(curr.date) ? prev : curr))
    .date.toString()

export const formatWithCommas = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

interface RawStateDay {
  date: string
  state: string
  fips: string
  cases: string
  deaths: string
}

export interface StateDay {
  date: LocalDate
  state: string
  fips: string
  cases: number
  deaths: number
}

interface Tweet {
  id_str: string
}

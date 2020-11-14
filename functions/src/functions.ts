import { DateTimeFormatter, LocalDate } from '@js-joda/core'
import axios from 'axios'
import Papa from 'papaparse'
import config from './config'
import { dateExistsInFirestore, insertDataIntoFirestore } from './firestore'
import { sendTweet } from './tweet'

export const runNyt = async () => {
  if (!config.STATE) {
    throw 'STATE not found in env variables.'
  }

  console.log('Getting data...')
  const stateData = await getStateData(config.STATE, 'states')

  console.log(`${stateData.length} rows. Calculating max date...`)
  const maxDate = getMaxDate(stateData)

  console.log(`Max date is ${maxDate}. Checking database...`)
  const exists = await dateExistsInFirestore(maxDate, 'nyt')

  if (exists) {
    console.log('Date already exists in database. No new tweet.')
  } else {
    console.log('Date not found in database.')
    const empty = getEmptyStateDayArray(LocalDate.parse(maxDate))
    const filled = getFilledArray(empty, stateData)
    const enhanced = getEnhancedArray(filled)
    await Promise.all([
      sendAndLog('1', getEnhancedTweetText(enhanced), maxDate),
      sendAndLog('2', getStateTweetText(stateData), maxDate),
    ])
  }
}

const sendAndLog = async (id: string, text: string, date: string) => {
  try {
    console.log(`Sending tweet ${id}...`)
    const tweet: Tweet = await sendTweet(text)

    console.log(`Updating database for tweet ${id}...`)
    await insertDataIntoFirestore(date, 'nyt', tweet.id_str)
  } catch (e) {
    console.error(e)
  }
}

export const getDateArray = (end: LocalDate) => {
  const NUM_DAYS = 90
  const returnable: LocalDate[] = []
  for (let i = 0; i < NUM_DAYS; i++) {
    returnable.push(end.minusDays(i))
  }
  return returnable
}

const getEmptyStateDayArray: (end: LocalDate) => StateDay[] = end =>
  getDateArray(end).map(date => ({
    date,
    state: '',
    fips: '',
    cases: 0,
    deaths: 0,
  }))

const getFilledArray: (empty: StateDay[], raw: StateDay[]) => StateDay[] = (empty, raw) => {
  const returnable: StateDay[] = []
  empty.forEach(day => {
    const rawOfDate = raw.find(rawDay => rawDay.date.isEqual(day.date))
    returnable.push({
      ...day,
      state: rawOfDate?.state || '',
      fips: rawOfDate?.fips || '',
      cases: rawOfDate?.cases || 0,
      deaths: rawOfDate?.deaths || 0,
    })
  })
  return returnable
}

// pass in sorted array that has no gaps
const getEnhancedArray = (stateDays: StateDay[]) => {
  const returnable: StateDay[] = []
  for (let i = 0; i < stateDays.length - 1; i++) {
    returnable.push({
      ...stateDays[i],
      newCases: stateDays[i].cases - stateDays[i + 1].cases,
      newDeaths: stateDays[i].deaths - stateDays[i + 1].deaths,
    })
  }
  return returnable
}

const getEnhancedTweetText = (enhanced: StateDay[]) => `CASES ${getGraphEmoji(enhanced, 'newCases')}
${getMetricTweetText(enhanced, 'newCases')}

DEATHS ${getGraphEmoji(enhanced, 'newDeaths')}
${getMetricTweetText(enhanced, 'newDeaths')}
`

const getGraphEmoji = (data: StateDay[], metric: 'newCases' | 'newDeaths') =>
  getAverage(data, 0, 7, metric) > getAverage(data, 7, 14, metric) ? '📈' : '📉'

const getMetricTweetText = (
  data: StateDay[],
  metric: 'newCases' | 'newDeaths',
) => `${formatWithCommas(data[0][metric])}: New for ${getFormattedDate(data[0].date)}
${getAverage(data, 0, 7, metric)}: 7 day avg for ${getFormattedDate(
  data[6].date,
)} to ${getFormattedDate(data[0].date)}
${getAverage(data, 7, 14, metric)}: 7 day avg for ${getFormattedDate(
  data[13].date,
)} to ${getFormattedDate(data[7].date)}
${getAverage(data, 0, 30, metric)}: 30 day avg
${getAverage(data, 0, 90, metric)}: 90 day avg
`

const getAverage = (
  array: StateDay[],
  startIndex: number,
  endIndex: number,
  property: 'newCases' | 'newDeaths',
) =>
  formatWithCommas(
    array.slice(startIndex, endIndex).reduce((total, el) => total + (el[property] || 0), 0) /
      (endIndex - startIndex),
  )

const getFormattedDate = (localDate: LocalDate) =>
  localDate.format(DateTimeFormatter.ofPattern('M/d'))

// TODO improve types
export const getStateData = <T extends RawStateDay>(state: string, file: 'states' | 'counties') =>
  axios
    .get<string>(`https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-${file}.csv`)
    .then(response =>
      Papa.parse<T>(response.data, { header: true })
        .data.filter(row => row.state === state)
        .map(row => ({
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
  stateDays.reduce((prev, curr) => (prev.date.isAfter(curr.date) ? prev : curr)).date.toString()

export const formatWithCommas = (n?: number) =>
  n
    ? Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : ''

export interface RawStateDay {
  date: string
  state: string
  fips: string
  cases: string
  deaths: string
}

export type RawCountyDay = RawStateDay & { county: string }

export interface StateDay {
  date: LocalDate
  state: string
  fips: string
  cases: number
  deaths: number
  newCases?: number
  newDeaths?: number
}

export type CountyDay = StateDay & { county: string }

interface Tweet {
  id_str: string
}

export type Source = 'nyt' | 'ncdhhs'

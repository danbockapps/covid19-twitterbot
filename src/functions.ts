import { LocalDate } from '@js-joda/core'
import axios from 'axios'
import Papa from 'papaparse'

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

export const getStateTweetText = async (state: string) => {
  const data = await getStateData(state)
  return `Updated data for ${state}

Cases
${getDayMetric(data, 'cases', 1)}: Now
${getDayMetric(data, 'cases', 2)}: Yesterday
${getDayMetric(data, 'cases', 8)}: 7 days ago
${getDayMetric(data, 'cases', 31)}: 30 days ago

Deaths
${getDayMetric(data, 'deaths', 1)}: Now
${getDayMetric(data, 'deaths', 2)}: Yesterday
${getDayMetric(data, 'deaths', 8)}: 7 days ago
${getDayMetric(data, 'deaths', 31)}: 30 days ago
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

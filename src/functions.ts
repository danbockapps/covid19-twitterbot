import axios from 'axios'
import Papa from 'papaparse'

const getData = () =>
  axios
    .get<string>(
      'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv'
    )
    .then(response => Papa.parse(response.data, { header: true }).data)

export const getStateData: (state: string) => Promise<StateDay[]> = state =>
  getData().then(data =>
    data
      .filter((row: RawStateDay) => row.state === state)
      .map((row: RawStateDay) => ({
        ...row,
        date: new Date(row.date),
        cases: Number(row.cases),
        deaths: Number(row.deaths),
      }))
  )

interface RawStateDay {
  date: string
  state: string
  fips: string
  cases: string
  deaths: string
}

export interface StateDay {
  date: Date
  state: string
  fips: string
  cases: number
  deaths: number
}

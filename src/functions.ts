import axios from 'axios'
import Papa from 'papaparse'

const getData = () =>
  axios
    .get<string>(
      'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv'
    )
    .then(response => Papa.parse(response.data, { header: true }).data)

export const getStateData = (state: string) =>
  getData().then(data => data.filter(row => row.state === state))

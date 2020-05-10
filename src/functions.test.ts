import { ChronoUnit, LocalDate } from '@js-joda/core'
import axios from 'axios'
import {
  formatWithCommas,
  getDayMetric,
  getMaxDate,
  getStateData,
  getStateTweetText,
  StateDay,
} from './functions'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockResponse = {
  data:
    'date,state,fips,cases,deaths\n' +
    '2020-01-21,Washington,53,1,0\n' +
    '2020-01-22,Washington,53,1,0\n' +
    '2020-01-23,Washington,53,1,0\n' +
    '2020-01-24,Illinois,17,1,0\n' +
    '2020-01-24,Washington,53,1,0\n' +
    '2020-01-25,California,06,1,0\n',
}

let washData: StateDay[]

beforeAll(async () => {
  mockedAxios.get.mockResolvedValue(mockResponse)
  washData = await getStateData('Washington')
})

it('gets the data', async () => {
  expect(washData).toHaveLength(4)
  expect(washData[3].date).toEqual(LocalDate.parse('2020-01-24'))
  expect(washData[3].cases).toEqual(1)
})

it('gets metrics from the data', () => {
  const daysSince124 = LocalDate.parse('2020-01-24').until(
    LocalDate.now(),
    ChronoUnit.DAYS,
  )

  const daysSince125 = LocalDate.parse('2020-01-25').until(
    LocalDate.now(),
    ChronoUnit.DAYS,
  )

  expect(getDayMetric(washData, 'cases', daysSince124)).toEqual(1)
  expect(getDayMetric(washData, 'cases', daysSince125)).toEqual(0)
})

it('constructs state tweet text', () => {
  const tweetText = getStateTweetText(washData)
  expect(tweetText).toEqual(expect.stringContaining('30 days ago'))
})

const stateDays: StateDay[] = [
  {
    date: LocalDate.parse('2020-04-26'),
    state: 'North Carolina',
    fips: '',
    cases: 0,
    deaths: 0,
  },
  {
    date: LocalDate.parse('2020-04-27'),
    state: 'North Carolina',
    fips: '',
    cases: 0,
    deaths: 0,
  },
  {
    date: LocalDate.parse('2020-04-28'),
    state: 'North Carolina',
    fips: '',
    cases: 0,
    deaths: 0,
  },
]

it('gets the max date from an array', () => {
  expect(getMaxDate(stateDays)).toBe('2020-04-28')
})

it('formats numbers with commas', () => {
  expect(formatWithCommas(1)).toBe('1')
  expect(formatWithCommas(12)).toBe('12')
  expect(formatWithCommas(1234)).toBe('1,234')
  expect(formatWithCommas(1234567)).toBe('1,234,567')
})

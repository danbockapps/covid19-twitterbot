import axios from 'axios'
import { getStateData } from './functions'

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

it('gets the data', async () => {
  mockedAxios.get.mockResolvedValue(mockResponse)
  const data = await getStateData('Washington')
  expect(data).toHaveLength(4)
  expect(data[3].date).toEqual(new Date('2020-01-24'))
  expect(data[3].cases).toEqual(1)
})

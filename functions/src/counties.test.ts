import axios from 'axios'
import { CountyDay, getStateData, RawCountyDay } from './functions'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockResponseCounty = {
  data:
    'date,county,state,fips,cases,deaths\n' +
    `2020-11-13,Fremont,Wyoming,56013,2284,21
2020-11-13,Goshen,Wyoming,56015,337,6,
2020-11-13,Hot Springs,Wyoming,56017,73,0
2020-11-13,Johnson,Wyoming,56019,174,2
2020-11-13,Laramie,Wyoming,56021,3104,14
2020-11-13,Lincoln,Wyoming,56023,474,4
2020-11-13,Natrona,NotWyoming,56025,3013,16
2020-11-13,Niobrara,NotWyoming,56027,50,0
2020-11-13,Park,NotWyoming,56029,1064,3
2020-11-13,Platte,NotWyoming,56031,239,4
2020-11-13,Sheridan,Wyoming,56033,1208,8
2020-11-13,Sublette,Wyoming,56035,252,1
2020-11-13,Sweetwater,Wyoming,56037,991,4
2020-11-13,Teton,Wyoming,56039,1108,2
2020-11-13,Uinta,Wyoming,56041,686,4
2020-11-13,Washakie,Wyoming,56043,205,7
2020-11-13,Weston,Wyoming,56045,330,0`,
}

let wyoData: CountyDay[]

beforeAll(async () => {
  mockedAxios.get.mockResolvedValue(mockResponseCounty)
  wyoData = await getStateData<RawCountyDay>('Wyoming', 'counties')
})

it('gets the data', async () => {
  expect(wyoData).toHaveLength(13)
})

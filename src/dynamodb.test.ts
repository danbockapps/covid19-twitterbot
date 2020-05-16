import AWS from 'aws-sdk'
import { dateExistsInDb, insertDataIntoDb } from './dynamodb'

jest.mock('aws-sdk')
const mockedAWS = AWS as jest.Mocked<typeof AWS>

const mockTrueResponse = { promise: () => ({ Item: { date: '2020-04-25' } }) }
const mockFalseResponse = { promise: () => ({}) }

let docClientMockInstance: any

beforeAll(() => {
  docClientMockInstance = (mockedAWS.DynamoDB.DocumentClient as jest.Mock).mock
    .instances[0]
})

it('correctly translates database responses to true and false', async () => {
  docClientMockInstance.get.mockReturnValue(mockFalseResponse)
  const result1 = await dateExistsInDb('2020-04-25')
  expect(result1).toBe(false)

  docClientMockInstance.get.mockReturnValue(mockTrueResponse)
  const result2 = await dateExistsInDb('2020-04-25')
  expect(result2).toBe(true)
})

it('inserts into the database', async () => {
  docClientMockInstance.put.mockReturnValue({ promise: () => {} })
  await insertDataIntoDb('Date goes here', '123')
  expect(docClientMockInstance.put).toHaveBeenCalledTimes(1)
})

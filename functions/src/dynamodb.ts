import AWS from 'aws-sdk'

AWS.config.update({
  region: 'us-east-2',
})

const docClient = new AWS.DynamoDB.DocumentClient()

export const dateExistsInDb = async (date: String) => {
  const result = await docClient
    .get({ TableName: 'Tweets', Key: { date } })
    .promise()

  if (result.Item) return true
  else return false
}

export const insertDataIntoDb = async (date: String, tweetId: string) => {
  return await docClient
    .put({ TableName: 'Tweets', Item: { date, tweetId } })
    .promise()
}

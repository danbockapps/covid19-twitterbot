import { getStateData } from "./functions"
import dotenv from 'dotenv';

export const handler = async (event: any = {}): Promise<any> => {
  const data = await getStateData('North Carolina')
  console.log(data)

  dotenv.config()
  console.log(process.env)

  const response = JSON.stringify(event)
  return response
}

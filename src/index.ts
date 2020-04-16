import { getStateData } from "./functions"

export const handler = async (event: any = {}): Promise<any> => {
  const data = await getStateData('North Carolina')
  console.log(data)

  const response = JSON.stringify(event)
  return response
}

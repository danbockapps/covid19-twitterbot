import { run } from './functions'

export const handler = async (event: any = {}): Promise<any> => {
  await run()
}

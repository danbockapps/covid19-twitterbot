import { LocalDate } from '@js-joda/core'
import { getSavedRates, saveAllRates } from './firestore'
import { CountyDay, getStateData, RawCountyDay } from './functions'
import population from './population'
import { sendTweet } from './tweet'

export const runCounties = async (tweet: boolean) => {
  try {
    const endDate = LocalDate.now().minusDays(1)

    const [oldRates, newRates] = await Promise.all([
      (async () => {
        console.log(new Date().toISOString(), 'Starting oldRates')
        const returnable = await getSavedRates(LocalDate.now().minusDays(2))
        console.log(new Date().toISOString(), 'Ending oldRates')
        return returnable
      })(),
      (async () => {
        console.log(new Date().toISOString(), 'Starting newRates')
        const returnable = await getCountyRates(endDate)
        console.log(new Date().toISOString(), 'Ending newRates')
        return returnable
      })(),
    ])

    console.log('oldRates.length', oldRates.length, 'newRates.length', newRates.length)

    // TODO we don't need newRates if tweet === false
    if (oldRates.length === 100 && newRates.length === 100)
      return await Promise.all([
        (async () => {
          if (tweet) {
            console.log('Starting sendTweet')
            await sendTweet(getTweetText(mergeRates(oldRates, newRates), 0, ''))
            console.log('Ending sendTweet')
          }
        })(),
        (async () => {
          if (tweet) {
            console.log('Starting sendTweet for big cos')
            await sendTweet(getBigCosTweetText(mergeRates(oldRates, newRates), 0, ''))
            console.log('Ending sendTweet for big cos')
          }
        })(),
        (async () => {
          console.log('Starting saveAllRates')
          await saveAllRates(newRates, endDate)
          console.log('Ending saveAllRates')
        })(),
      ])
  } catch (e) {
    console.error(e)
  }
}

export interface Rate {
  county: string
  rate: number
}

export interface MergedRate {
  county: string
  oldRate: number
  newRate: number
}

export const mergeRates = (oldRates: Rate[], newRates: Rate[]): MergedRate[] =>
  oldRates
    .reduce<MergedRate[]>(
      (acc, cur) =>
        acc.concat({
          county: cur.county,
          oldRate: cur.rate,
          newRate: newRates.find(r => r.county === cur.county)?.rate || 0,
        }),
      [],
    )
    .sort((a, b) => b.newRate - a.newRate)

export const roundOff = (n: number) => Math.round(n * 10) / 10

const getEmoji = (m: MergedRate) => (m.newRate > m.oldRate ? '🔺' : '⬇️')

export const getTweetText = (rates: MergedRate[], index: number, text: string): string => {
  const newText =
    index === 0
      ? `Top NC counties, 7-day avg new cases:

1. ${getEmoji(rates[index])} ${rates[index].county} County: ${roundOff(
          rates[index].newRate,
        )} per 100,000 people`
      : text.concat(`
${index + 1}. ${getEmoji(rates[index])} ${rates[index].county} ${roundOff(rates[index].newRate)}`)

  if (newText.length > 280) return text
  else return getTweetText(rates, index + 1, newText)
}

export const getBigCosTweetText = (rates: MergedRate[], index: number, text: string): string => {
  const ratesWithPop = rates
    .map(r => ({
      ...r,
      population: population.find(p => p.county === r.county)?.population || 0,
    }))
    .sort((a, b) => b.population - a.population)

  const newText =
    index === 0
      ? `Biggest NC counties, 7-day avg new cases:
    
${getEmoji(ratesWithPop[index])} ${ratesWithPop[index].county} County: ${roundOff(
          ratesWithPop[index].newRate,
        )} per 100,000 people`
      : text.concat(`
${getEmoji(ratesWithPop[index])} ${ratesWithPop[index].county} ${roundOff(
          ratesWithPop[index].newRate,
        )}`)

  if (newText.length > 280) return text
  else return getBigCosTweetText(ratesWithPop, index + 1, newText)
}

export const getCountyRates = async (end: LocalDate): Promise<Rate[]> => {
  console.time('counties')
  const nc: CountyDay[] = await getStateData<RawCountyDay>('North Carolina', 'counties')
  console.timeEnd('counties')

  return nc
    .filter(
      c =>
        (c.date.equals(end.minusDays(7)) || c.date.equals(end)) &&
        c.county.toLowerCase() !== 'unknown',
    )
    .reduce<{ county: string; start?: number; end?: number; population?: number }[]>(
      (acc, cur) =>
        acc.find(c => c.county === cur.county)
          ? acc.map(a =>
              a.county === cur.county
                ? {
                    ...a,
                    start: cur.date.equals(end.minusDays(7)) ? cur.cases : a.start,
                    end: cur.date.equals(end) ? cur.cases : a.end,
                  }
                : a,
            )
          : acc.concat({
              county: cur.county,
              start: cur.date.equals(end.minusDays(7)) ? cur.cases : undefined,
              end: cur.date.equals(end) ? cur.cases : undefined,
              population: population.find(p => p.county === cur.county)?.population,
            }),
      [],
    )
    .map(c => {
      if (!c.start || !c.end || !c.population)
        throw new Error('Incomplete data' + JSON.stringify(c))
      else return { county: c.county, rate: ((c.end - c.start) * 100000) / (c.population * 7) }
    })
}

import { LocalDate } from '@js-joda/core'
import { saveAllRates } from './firestore'
import { CountyDay, getStateData, RawCountyDay } from './functions'
import population from './population'
import { sendTweet } from './tweet'

export const runCounties = async () => {
  try {
    const endDate = LocalDate.now().minusDays(1)
    const rates = await getCountyRates(endDate)

    await Promise.all([
      async () => {
        console.log('Starting sendTweet')
        await sendTweet(getTweetText(rates, 0, ''))
        console.log('Ending sendTweet')
      },
      async () => {
        console.log('Starting saveAllRates')
        await saveAllRates(rates, endDate)
        console.log('Ending saveAllRates')
      },
    ])
  } catch (e) {
    console.error(e)
  }
}

export interface Rate {
  county: string
  rate: number
}

const roundOff = (n: number) => Math.round(n * 10) / 10

const getTweetText = (rates: Rate[], index: number, text: string): string => {
  const newText =
    index === 0
      ? `Top NC counties, 7-day avg new cases:

1. ${rates[index].county} County: ${roundOff(rates[index].rate)} per 100,000 people`
      : text.concat(`
${index + 1}. ${rates[index].county} ${roundOff(rates[index].rate)}`)

  if (newText.length > 280) return text
  else return getTweetText(rates, index + 1, newText)
}

export const getCountyRates = async (end: LocalDate): Promise<Rate[]> => {
  console.time('counties')
  const nc: CountyDay[] = await getStateData<RawCountyDay>('North Carolina', 'counties')
  console.timeEnd('counties')

  return nc
    .filter(c => c.date.equals(end.minusDays(7)) || c.date.equals(end))
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
      if (!c.start || !c.end || !c.population) throw new Error('Incomplete data')
      else return { county: c.county, rate: ((c.end - c.start) * 100000) / (c.population * 7) }
    })
    .sort((a, b) => b.rate - a.rate)
}

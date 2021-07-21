import { LocalDate } from '@js-joda/core'
import blueCounties from './blueCounties'
import { getCountyRatesMaxDate, getNytCoMaxDate, getSavedRates } from './firestore'
import { asyncAndLog, CountyDay, getStateData, RawCountyDay, sendAndLog } from './functions'
import population from './population'

export const runCounties = async () => {
  const [ratesMax, nytCoMax] = await Promise.all([
    asyncAndLog(() => getCountyRatesMaxDate(), 'County rates max date'),
    asyncAndLog(() => getNytCoMaxDate(), 'NYT co max date'),
  ])

  console.log('ratesMax', ratesMax, 'nytCoMax', nytCoMax)

  if (ratesMax === nytCoMax) {
    console.log('Dates are equal. No tweets.')
    return
  }

  const newDate = LocalDate.parse(ratesMax)

  const [oldRates, newRates] = await Promise.all([
    asyncAndLog(() => getSavedRates(newDate.minusDays(1)), 'oldRates'),
    asyncAndLog(() => getSavedRates(newDate), 'newRates'),
  ])

  console.log('oldRates.length', oldRates.length, 'newRates.length', newRates.length)

  if (oldRates.length !== 100 || newRates.length !== 100) {
    console.log('Lengths must both be 100 to tweet.')
    return
  }

  const mergedRates = mergeRates(oldRates, newRates)

  if (!mergedRates.some(r => r.newRate !== r.oldRate)) {
    console.log('Nothing changed. It might be the weekend.')
    return
  }

  return await Promise.all([
    asyncAndLog(() => sendAndLog(getCoTweetText(mergedRates), ratesMax, 'nyt_co'), 'co'),
    asyncAndLog(() => sendAndLog(getBigCosTweetText(mergedRates), ratesMax, 'nyt_big_co'), 'bigco'),
  ])
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

const getEmoji = (m: MergedRate) =>
  `${m.newRate === m.oldRate ? '↔️' : m.newRate > m.oldRate ? '⬆️' : '⬇️'} ${
    blueCounties.includes(m.county) ? '🔵' : '🔴'
  }`

export const getCoTweetText = (rates: MergedRate[], pIndex?: number, pText?: string): string => {
  const [index, text] = pIndex && pText ? [pIndex, pText] : [0, '']

  const newText =
    index === 0
      ? `Top NC counties, 7-day avg new cases:

${getEmoji(rates[index])} ${rates[index].county} County: ${roundOff(
          rates[index].newRate,
        )} per 100,000 people`
      : text.concat(`
${getEmoji(rates[index])} ${rates[index].county} ${roundOff(rates[index].newRate)}`)

  if (newText.length > 280) return text
  else return getCoTweetText(rates, index + 1, newText)
}

export const getBigCosTweetText = (
  rates: MergedRate[],
  pIndex?: number,
  pText?: string,
): string => {
  const [index, text] = pIndex && pText ? [pIndex, pText] : [0, '']

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

import { DateTimeFormatter, LocalDate } from '@js-joda/core'
import ordinal from 'ordinal'
import { getAllNcVax } from './firestore'
import { formatWithCommas } from './functions'
import { sendTweet } from './tweet'

interface RankData {
  date?: LocalDate
  newDoses: number
  rank?: number
}

export const runVaxDayRank = async (newDate: LocalDate) => {
  const data = await getAllNcVax()
  const rankData = data
    .map(e => ({
      date: e?.date,
      newDoses: e?.dose1total - data.find(d => d?.date.equals(e?.date.minusDays(1)))?.dose1total,
    }))
    .filter(e => e.newDoses && e.date !== undefined)
    .sort((a, b) => b.newDoses - a.newDoses)
    .reduce<RankData>(
      (acc, cur, i) => (cur.date?.equals(newDate) ? { ...cur, rank: i + 1 } : acc),
      { newDoses: 0 },
    )

  if (rankData.date && rankData.newDoses && rankData.rank) {
    const tweetResult = await sendTweet(getVaxDayRankTweetText(rankData))
    console.log({ tweetResult })
  }
}

export const getVaxDayRankTweetText: (data: RankData) => string = ({ date, newDoses, rank }) =>
  date && newDoses && rank
    ? `${
        rank === 1
          ? `🚨 NEW RECORD SET TODAY 🚨
    
`
          : 'New '
      }CDC report for ${date.format(DateTimeFormatter.ofPattern('M/d/yyyy'))}:

${formatWithCommas(newDoses)} new people received the first dose of the vaccine in NC.

${rank === 1 ? "That's a new record! 🎉 📈" : `That's the ${ordinal(rank)} best day so far.`}
`
    : ''

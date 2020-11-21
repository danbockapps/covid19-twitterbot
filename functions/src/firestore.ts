import { LocalDate } from '@js-joda/core'
import admin from 'firebase-admin'
import { Rate } from './counties'
import { Source } from './functions'

/*
Private key file was generated in Firebase Console settings.

Run this command to make it work locally:
export GOOGLE_APPLICATION_CREDENTIALS="/Users/dbock/code/covid19-twitterbot/covid19-twitterbot-firebase-adminsdk-m5oa0-ab9abc440c.json"
*/

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://covid19-twitterbot.firebaseio.com',
})

const db = admin.firestore()

export const insertDataIntoFirestore = (date: string, source: Source, tweetId: string) =>
  db.collection('tweets').doc(tweetId).set({
    date,
    source,
    created: admin.firestore.FieldValue.serverTimestamp(),
  })

export const dateExistsInFirestore = async (date: string, source: Source) => {
  const snapshot = await db
    .collection('tweets')
    .where('date', '==', date)
    .where('source', '==', source)
    .get()

  return !snapshot.empty
}

export const saveAllRates = async (rates: Rate[], date: LocalDate) => {
  let batch = db.batch()

  rates.forEach(rate => {
    const ref = db.collection('county-rates').doc()
    batch.set(ref, { ...rate, date: date.toString() })
  })

  return await batch.commit()
}

export const getSavedRates = async (date: LocalDate) => {
  const snapshot = await db.collection('county-rates').where('date', '==', date.toString()).get()

  const returnable: Rate[] = snapshot.docs.map(doc => {
    const { county, rate } = doc.data()
    return { county, rate }
  })

  return returnable
}

// For adhoc purposes
export const deleteDate = async (date: string) => {
  const snapshot = await db.collection('county-rates').where('date', '==', date).get()

  const batch = db.batch()
  snapshot.forEach(doc => batch.delete(doc.ref))
  return batch.commit()
}

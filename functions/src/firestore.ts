import { LocalDate } from '@js-joda/core'
import admin from 'firebase-admin'
import { CdcDataPoint } from './cdcvaccinations'
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

export const insertVaxProgress = (data: CdcDataPoint, source: Source) =>
  db
    .collection('vax-progress')
    .doc()
    .set({
      ...data,
      source,
      firestoreDate: admin.firestore.FieldValue.serverTimestamp(),
      localDate: LocalDate.now().toString(),
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

export const getLatest = async (source: Source): Promise<string> => {
  const snapshot = await db
    .collection('tweets')
    .where('source', '==', source)
    .orderBy('created', 'desc')
    .limit(1)
    .get()

  return snapshot.docs[0]?.id
}

export const get7daysAgo = async (currentDate: string): Promise<number> => {
  const snapshot = await db
    .collection('vax-progress')
    .where('source', '==', 'cdcv_nc')
    .where('Date', '==', LocalDate.parse(currentDate).minusDays(7).toString())
    .limit(1)
    .get()

  return snapshot.docs[0]?.data().Administered_Dose1
}

export const getAllNcVax = async () => {
  const snapshot = await db.collection('vax-progress').where('source', '==', 'cdcv_nc').get()
  return snapshot.docs
    .map(doc => {
      try {
        return {
          date: LocalDate.parse(doc.data().Date || ''),
          dose1total: doc.data().Administered_Dose1,
        }
      } catch (e) {}
    })
    .filter(d => d)
}

// For adhoc purposes
export const deleteDate = async (date: string) => {
  const snapshot = await db.collection('county-rates').where('date', '==', date).get()

  const batch = db.batch()
  snapshot.forEach(doc => batch.delete(doc.ref))
  return batch.commit()
}

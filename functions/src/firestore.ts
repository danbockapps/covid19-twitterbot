/*
Private key file was generated in Firebase Console settings.

Run this command to make it work locally:
export GOOGLE_APPLICATION_CREDENTIALS="/Users/dbock/code/covid19-twitterbot/covid19-twitterbot-firebase-adminsdk-m5oa0-ab9abc440c.json"
*/

import admin from 'firebase-admin'
import { Source } from './functions'

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

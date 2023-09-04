import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import { config } from '../config/firebase';

require('firebase/storage');
require('firebase/auth');

firebase.initializeApp(config);
export const { auth } = firebase;
export const db = firebase.database();
export const storage = firebase.storage().ref();

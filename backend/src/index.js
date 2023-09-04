import 'dotenv/config';
import express from 'express';
import * as admin from 'firebase-admin';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

admin.initializeApp({
	projectId: 'labez-f769c',
	credential: admin.credential.applicationDefault() ,
	databaseURL: 'https://labez-f769c-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
	res.send('hii')
});

app.post('/v1/signup', async (req, res) => {
	try {
		const { name, email, role, password } = req.body;
		const user = await admin.auth().createUser({
			password,
			displayName: name,
			emailVerified: true,
			email
		});
		await admin.auth().setCustomUserClaims(user.uid, {
			teacher: role === 'teacher'
		});
		const token = await admin.auth().createCustomToken(user.uid)
		await admin.database().ref(`/users/${user.uid}`).set({
			displayName: user.displayName,
			role,
		})
		return res.json({
			token,
		})
	} catch (e) {
	    res.status(500).send(e.message)
	}

});

app.post('/v1/rooms', async (req, res) => {
	try {
		const { name } = req.body;
		const roomAPIRes = await axios.post('https://api.daily.co/v1/rooms/', {
			name: name.replace(/\s+/g, '-'),
			privacy: 'public',
			properties: {
				start_video_off: true,
				start_audio_off: true,
			}
		}, {
			headers: {
				Authorization: `Bearer ${process.env.DAILY_TOKEN}`
			}
		});
		return res.json(roomAPIRes.data);
	} catch (e) {
		console.log(e);
		res.status(500).send(e.message)
	}
});

app.post('/v1/execute-script', async (req, res) => {
	try {
		let { language, script, stdin = '' } = req.body;
		const program = {
			language,
			script,
			stdin,
			versionIndex: '0',
			clientId: process.env.JDOODLE_CLIENT_ID,
			clientSecret: process.env.JDOODLE_CLIENT_SECRET,
		};
		const execAPIRes = await axios.post('https://api.jdoodle.com/v1/execute', program);
		return res.json(execAPIRes.data);
	} catch (e) {
		res.status(500).send(e.message)
	}
})

app.listen(8008, () => {
	console.log('listenting?');
})

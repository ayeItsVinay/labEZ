import {db} from "./firebase";

export const fetchUserDetails = async (userId) => {
  return new Promise((resolve, reject) => {
    db.ref(`/users/${userId}`).once('value', (snapshot) => {
      resolve(snapshot.val());
    });
  });
};
export const fetchLabDetails = async (labSessionId) => {
  return new Promise((resolve, reject) => {
    db.ref(`/lab-sessions/${labSessionId}/details`).once(
      'value',
      (snapshot) => {
        resolve(snapshot.val());
      }
    );
  });
};

import React, { useEffect, useState } from 'react';
import Container from 'reactstrap/lib/Container';
import Button from 'reactstrap/lib/Button';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../../services/firebase';
import Navbar from '../../components/Navbar';
import TeacherMain from './teacher';
import StudentMain from './student';
import NewLabSessionModal from '../components/NewLabSessionModal';

interface ProbemStatement {
  title: string;
  description: string;
}

const Main = () => {
  const history = useHistory();
  // @eslint-ignore @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>({ claims: { teacher: false } });

  useEffect(() => {
    auth().onAuthStateChanged((loggedInUser) => {
      if (!loggedInUser) {
        history.push('/auth');
      } else {
        auth()
          .currentUser.getIdTokenResult()
          .then((iDtokenResult) => {
            setUser({
              ...loggedInUser,
              teacher: iDtokenResult?.claims?.teacher,
            });
          });
      }
    });
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ position: 'relative', height: '87h' }} >
        {user.teacher ? <TeacherMain /> : <StudentMain />}
        <img style={{
          position: 'absolute',
          left: '25%',
          bottom: user.teacher ? '100px': '0',
          zIndex: -1,
          opacity: '90%'
        }} src={'https://shapeai-uploads.s3.ap-south-1.amazonaws.com/undraw_coding.png'} />
      </div>
    </>
  );
};

export default Main;

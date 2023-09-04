import React, { useEffect, useState } from 'react';
import Container from 'reactstrap/lib/Container';
import Button from 'reactstrap/lib/Button';
import { useHistory } from 'react-router-dom';
import { db } from '../../services/firebase';
import NewLabSessionModal from '../../components/NewLabSessionModal';
import { createMeetingRoom } from '../../services/api';
import StudentMain from "./student";

interface ProblemStatement {
  title: string;
  description: string;
}

const TeacherMain = () => {
  // @eslint-ignore @typescript-eslint/no-explicit-any
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleNewModal = () => setIsModalOpen((p) => !p);
  const history = useHistory();
  const [labCode, setLabCode] = useState('');
  const joinSession = () => {
    localStorage.setItem('labSessionId', labCode);
    history.push('/lab-session');
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const createLabSession = async ({
    name,
    problemStatements,
    executionEnvironment,
  }: {
    name: string;
    problemStatements: ProblemStatement[];
    executionEnvironment: string;
  }) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const labSessionId = `${new Date().getTime()}-${String(Math.random()).slice(
      2,
      8
    )}`;
    const res = await createMeetingRoom(name);
    await db.ref(`/lab-sessions/${labSessionId}/details`).set({
      name,
      problemStatements,
      executionEnvironment,
      dailyMeetId: res.data.id,
      url: res.data.url,
    });
    localStorage.setItem('labSessionId', labSessionId);
    history.push('/lab-session');
  };
  return (
    <>
      <Container style={{ position: 'relative', paddingTop: '3%' }} >
        <Button style={{ position: 'absolute', right: '10px' }} onClick={toggleNewModal} size="md" color="dark">
          Create New Lab Session
        </Button>
        {/*<NammaInput*/}
        {/*  onChange={(e) => setLabCode(e.target.value)}*/}
        {/*  type="text"*/}
        {/*  label="Lab code"*/}
        {/*  value={labCode}*/}
        {/*/>*/}
        {/*<Button*/}
        {/*  block*/}
        {/*  size="lg"*/}
        {/*  style={{ color: 'black', fontSize: 'xx-large', fontWeight: 900 }}*/}
        {/*  color="primary"*/}
        {/*  outline*/}
        {/*  onClick={joinSession}*/}
        {/*>*/}
        {/*  Join*/}
        {/*</Button>*/}
      </Container>
      <StudentMain top={'0%'} />

      <NewLabSessionModal
        isOpen={isModalOpen}
        toggle={toggleNewModal}
        onSubmit={(formData) => {
          createLabSession(formData);
        }}
      />
    </>
  );
};

export default TeacherMain;

import React, { useState } from 'react';
import Container from 'reactstrap/lib/Container';
import Button from 'reactstrap/lib/Button';
import NammaInput from '../../components/NammaInput';
import { useHistory } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js'
import { fetchLabDetails } from '../../services/fb-helpers';
import Alert from "reactstrap/lib/Alert";

const StudentMain = ({ top }) => {
  const history = useHistory();
  const [labCode, setLabCode] = useState('');
  const [error, setError] = useState('');
  const joinSession = async () => {
    if (!labCode) return setError('Please enter a valid code');
    const labData = await fetchLabDetails(labCode);
    if (!labData) return setError('No Session found with the given Code');
    localStorage.setItem('labSessionId', labCode);
    history.push('/lab-session');
  }
  return (
    <>
      <Container
        style={{ paddingTop: top || '10%', paddingLeft: '5%', paddingRight: '5%', height: '86vh' }}
      >
        <h2>Join a lab session with code</h2>
        <Alert isOpen={error} toggle={() => setError('')}>
          {' '}
          <div dangerouslySetInnerHTML={{ __html: error }} />{' '}
        </Alert>
        <NammaInput
          onChange={(e) => setLabCode(e.target.value)}
          type="text"
          label="Lab code"
          value={labCode}
        />
        <Button
          block
          size="lg"
          style={{ color: 'white', fontSize: 'xx-large', fontWeight: 900 }}
          color="dark"
          onClick={joinSession}
        >
          Join
        </Button>
      </Container>
    </>
  );
};

export default StudentMain;
